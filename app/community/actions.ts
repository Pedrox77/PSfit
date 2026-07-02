"use server";

import {
  deletePostMedia,
  uploadPostMedia,
  uploadStoryMedia,
  validateMediaFile,
} from "@/lib/community/media";
import {
  isPostType,
  isPostVisibility,
  isTrainingVisualStyle,
} from "@/lib/community/post-options";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeMuscles,
  normalizeMuscle,
  type MuscleGroup,
} from "@/lib/training/muscle-normalizer";
import { usernameSchema } from "@/lib/validations/username";
import type { WorkoutReceipt } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreatePostState = {
  ok: boolean;
  error?: string;
  code?: string;
};

export type UpdateProfileState = {
  ok: boolean;
  error?: string;
};

type ErrorDetails = {
  message: string;
  code?: string;
  details?: unknown;
  hint?: unknown;
};

class PostValidationError extends Error {
  code = "VALIDATION";
}

function getErrorDetails(error: unknown): ErrorDetails {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const value = error as Record<string, unknown>;
  return {
    message:
      typeof value.message === "string"
        ? value.message
        : "Unknown Community error",
    code:
      typeof value.code === "string"
        ? value.code
        : typeof value.statusCode === "string"
          ? value.statusCode
          : undefined,
    details: value.details,
    hint: value.hint,
  };
}

function logCreatePostError(
  error: unknown,
  context = "create post",
) {
  const details = getErrorDetails(error);
  console.error(`[PSFIT COMMUNITY: ${context}]`, details);
}

function createPostErrorState(error: unknown): CreatePostState {
  const details = getErrorDetails(error);
  const message = details.message.toLowerCase();
  const code = details.code;

  if (error instanceof PostValidationError) {
    return { ok: false, error: error.message, code: error.code };
  }
  if (
    code === "AUTH_REQUIRED" ||
    message.includes("authentication required") ||
    message.includes("auth session missing") ||
    message.includes("session missing") ||
    message.includes("refresh token") ||
    message.includes("jwt expired")
  ) {
    return {
      ok: false,
      error: "Your session expired. Sign in again.",
      code: code ?? "AUTH_REQUIRED",
    };
  }
  if (
    code === "42501" ||
    message.includes("row-level security") ||
    message.includes("row level security")
  ) {
    return {
      ok: false,
      error: "You do not have permission to publish this post.",
      code,
    };
  }
  if (code === "23514") {
    return {
      ok: false,
      error:
        "This post type or visibility is not supported by the current database schema.",
      code,
    };
  }
  if (code === "42703" || code === "PGRST204") {
    return {
      ok: false,
      error:
        "The Community database is missing a required column. Apply the latest migration.",
      code,
    };
  }
  if (
    message.includes("bucket") &&
    (message.includes("not found") ||
      message.includes("does not exist"))
  ) {
    return {
      ok: false,
      error: "The Community media bucket is not configured.",
      code,
    };
  }

  return {
    ok: false,
    error: "We could not publish your post. Please try again.",
    code,
  };
}

async function userClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }
  if (!data.user) {
    throw Object.assign(new Error("Authentication required"), {
      code: "AUTH_REQUIRED",
    });
  }

  return { supabase, user: data.user };
}

async function rollbackPost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  uploadedPaths: string[],
) {
  try {
    await deletePostMedia(uploadedPaths);
  } catch (error) {
    logCreatePostError(error, "media rollback failed");
  }

  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    if (error) {
      logCreatePostError(error, "post rollback failed");
    }
  } catch (error) {
    logCreatePostError(error, "post rollback failed");
  }
}

type ReceiptExercise = {
  id: string;
  name: string;
  sets: number | string | null;
  muscle_group: string | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  repetitions: string | null;
  suggested_weight_kg: number | string | null;
  rest_seconds: number | null;
  catalog_exercise_id: string | null;
  exercise_catalog: {
    primary_muscle: string | null;
    secondary_muscles: string[] | null;
  } | Array<{
    primary_muscle: string | null;
    secondary_muscles: string[] | null;
  }> | null;
};

function exerciseCatalog(exercise: ReceiptExercise) {
  return Array.isArray(exercise.exercise_catalog)
    ? exercise.exercise_catalog[0] ?? null
    : exercise.exercise_catalog;
}

function positiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function repetitionCount(value: unknown) {
  if (typeof value === "number") return positiveNumber(value);
  if (typeof value !== "string" || !/^\s*\d+(?:[.,]\d+)?\s*$/.test(value)) return null;
  return positiveNumber(value.replace(",", "."));
}

function estimatedDuration(exercises: ReceiptExercise[]) {
  let seconds = 0;
  let hasUsefulData = false;
  for (const exercise of exercises) {
    const sets = positiveNumber(exercise.sets);
    if (!sets) continue;
    hasUsefulData = true;
    const repetitions = repetitionCount(exercise.repetitions);
    const activeSeconds = repetitions ? Math.max(30, repetitions * 3) : 40;
    const restSeconds = positiveNumber(exercise.rest_seconds) ?? 60;
    seconds += sets * activeSeconds + Math.max(0, sets - 1) * restSeconds + 90;
  }
  return hasUsefulData ? Math.max(10, Math.ceil(seconds / 60)) : 0;
}

function splitFocus(value: unknown) {
  return typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function presentationAreas(values: Array<string | null | undefined>) {
  const structural: Record<string, string> = {
    upper_body: "upper_body",
    "upper body": "upper_body",
    superiores: "upper_body",
    lower_body: "lower_body",
    "lower body": "lower_body",
    inferiores: "lower_body",
  };
  const result: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const cleaned = value.trim().toLocaleLowerCase().replace(/[_-]+/g, " ");
    const area = structural[cleaned.replaceAll(" ", "_")] ??
      structural[cleaned] ??
      normalizeMuscle(value);
    if (area && !result.includes(area)) result.push(area);
  }
  return result;
}

async function getWorkoutReceipt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
): Promise<WorkoutReceipt> {
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(
      "id,duration_minutes,total_volume_kg,calories,perceived_effort,sets_completed,exercises_completed,completed_at,workouts(id,name,name_key,focus,estimated_minutes,difficulty,exercises(id,name,sets,repetitions,suggested_weight_kg,rest_seconds,muscle_group,primary_muscles,secondary_muscles,catalog_exercise_id,exercise_catalog(primary_muscle,secondary_muscles)))",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) {
    throw new PostValidationError(
      "The completed workout session could not be found.",
    );
  }

  const { data: logs, error: logsError } = await supabase
    .from("workout_set_logs")
    .select("exercise_id,weight_kg,repetitions")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("is_completed", true);
  if (logsError) throw logsError;

  const workout = Array.isArray(session.workouts)
    ? session.workouts[0]
    : session.workouts;
  const exercises = (workout?.exercises ?? []) as unknown as ReceiptExercise[];
  if (!workout?.id || exercises.length === 0) {
    throw new PostValidationError("O treino salvo não possui exercícios.");
  }
  const completedSets = new Map<string, number>();
  for (const log of logs ?? []) {
    completedSets.set(
      log.exercise_id,
      (completedSets.get(log.exercise_id) ?? 0) + 1,
    );
  }
  const configuredSets = exercises.reduce(
    (total, exercise) => total + (positiveNumber(exercise.sets) ?? 0),
    0,
  );
  const logVolume = (logs ?? []).reduce((total, log) => {
    const weight = positiveNumber(log.weight_kg);
    const repetitions = positiveNumber(log.repetitions);
    return weight && repetitions ? total + weight * repetitions : total;
  }, 0);
  const configuredVolume = exercises.reduce((total, exercise) => {
    const sets = positiveNumber(exercise.sets);
    const repetitions = repetitionCount(exercise.repetitions);
    const weight = positiveNumber(exercise.suggested_weight_kg);
    return sets && repetitions && weight
      ? total + sets * repetitions * weight
      : total;
  }, 0);

  const primarySets = new Map<MuscleGroup, number>();
  const secondarySets = new Map<MuscleGroup, number>();
  for (const exercise of exercises) {
    const sets = completedSets.get(exercise.id) ?? 0;
    if (!sets) continue;
    const catalog = exerciseCatalog(exercise);
    const primary = normalizeMuscles([
      ...(exercise.primary_muscles ?? []),
      exercise.muscle_group,
      catalog?.primary_muscle,
    ]);
    const secondary = normalizeMuscles(
      [
        ...(catalog?.secondary_muscles ?? []),
        ...(exercise.secondary_muscles ?? []),
      ],
    );
    for (const muscle of primary) {
      primarySets.set(
        muscle,
        (primarySets.get(muscle) ?? 0) + sets,
      );
    }
    for (const muscle of secondary) {
      secondarySets.set(
        muscle,
        (secondarySets.get(muscle) ?? 0) + sets,
      );
    }
  }
  for (const muscle of primarySets.keys()) {
    secondarySets.delete(muscle);
  }

  const primaryMuscles = [...primarySets.keys()];
  const secondaryMuscles = [...secondarySets.keys()];
  const trainedAreas = presentationAreas([
    ...splitFocus(workout?.focus),
    ...exercises.flatMap((exercise) => exercise.primary_muscles ?? []),
    ...exercises.map((exercise) => exercise.muscle_group),
    ...exercises.map((exercise) => exerciseCatalog(exercise)?.primary_muscle),
    ...exercises.flatMap((exercise) => exerciseCatalog(exercise)?.secondary_muscles ?? []),
    ...exercises.flatMap((exercise) => exercise.secondary_muscles ?? []),
  ]);
  const estimatedMinutes = positiveNumber(workout?.estimated_minutes);
  const durationMinutes = estimatedMinutes
    ?? positiveNumber(session.duration_minutes)
    ?? estimatedDuration(exercises);
  const setsCompleted = configuredSets || completedSets.size
    ? configuredSets || [...completedSets.values()].reduce((sum, sets) => sum + sets, 0)
    : positiveNumber(session.sets_completed) ?? 0;
  const volume = logVolume || configuredVolume || positiveNumber(session.total_volume_kg) || 0;
  return {
    session_id: session.id,
    workout_id: workout?.id,
    name_key: workout?.name_key ?? null,
    title: workout?.name ?? "Workout",
    duration_minutes: durationMinutes,
    exercises_completed: exercises.length || Number(session.exercises_completed ?? 0),
    sets_completed: setsCompleted,
    total_volume_kg: volume,
    ...(session.calories != null
      ? { calories: Number(session.calories) }
      : {}),
    muscles: trainedAreas,
    primary_muscles: primaryMuscles,
    secondary_muscles: secondaryMuscles,
    trained_areas: trainedAreas,
    muscle_intensity: Object.fromEntries([
      ...primarySets.entries(),
      ...secondarySets.entries(),
    ]),
    effort: Number(session.perceived_effort ?? 0),
    personal_records: 0,
    completed_at:
      session.completed_at ?? new Date().toISOString(),
    momentum_score: 0,
    exercises: exercises
      .map((exercise) => ({
        name: exercise.name,
        sets: positiveNumber(exercise.sets) ?? completedSets.get(exercise.id) ?? 0,
        repetitions: exercise.repetitions ?? "—",
      })),
  };
}

export async function getWorkoutReceiptPreview(
  sessionId: string,
): Promise<WorkoutReceipt | null> {
  try {
    const { supabase, user } = await userClient();
    return await getWorkoutReceipt(
      supabase,
      user.id,
      sessionId,
    );
  } catch (error) {
    logCreatePostError(error, "workout receipt preview");
    return null;
  }
}

export async function createPost(
  _previousState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  let postId: string | undefined;
  let supabase: Awaited<ReturnType<typeof createClient>> | undefined;
  const uploadedPaths: string[] = [];

  try {
    const authenticated = await userClient();
    supabase = authenticated.supabase;
    const { user } = authenticated;
    const caption = String(formData.get("caption") ?? "").trim();
    const postType = String(formData.get("post_type") ?? "");
    const visibility = String(formData.get("visibility") ?? "");
    const trainingVisualStyle = String(
      formData.get("training_visual_style") ?? "full_carousel",
    );

    if (!isPostType(postType)) {
      throw new PostValidationError("Choose a supported post type.");
    }
    if (!isPostVisibility(visibility)) {
      throw new PostValidationError("Choose a supported visibility.");
    }
    if (!isTrainingVisualStyle(trainingVisualStyle)) {
      throw new PostValidationError(
        "Choose a supported workout visual style.",
      );
    }
    if (caption.length > 2200) {
      throw new PostValidationError("Caption is too long.");
    }

    const hashtags = [
      ...caption.matchAll(/#([a-z0-9_]{1,50})/gi),
    ]
      .map((match) => match[1].toLowerCase())
      .slice(0, 20);
    const files = formData
      .getAll("media")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0,
      );

    if (files.length > 10) {
      throw new PostValidationError(
        "Choose up to 10 images or one video.",
      );
    }

    const validations = files.map(validateMediaFile);
    const invalidMedia = validations.find(
      (validation) => !validation.valid,
    );
    if (invalidMedia) {
      throw new PostValidationError(
        invalidMedia.error ?? "Invalid media file.",
      );
    }
    if (
      validations.some(
        (validation) => validation.kind === "video",
      ) &&
      files.length !== 1
    ) {
      throw new PostValidationError(
        "A video must be the only media item.",
      );
    }

    const workoutSessionId = String(
      formData.get("workout_session_id") ?? "",
    ).trim();
    const workoutReceipt = workoutSessionId
      ? await getWorkoutReceipt(
          supabase,
          user.id,
          workoutSessionId,
        )
      : null;

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        workout_session_id: workoutSessionId || null,
        workout_receipt: workoutReceipt,
        post_type: postType,
        caption,
        workout_title:
          String(formData.get("workout_title") ?? "") ||
          workoutReceipt?.title ||
          null,
        visibility,
        location:
          String(formData.get("location") ?? "") || null,
        allow_comments: formData.get("allow_comments") === "on",
        hide_like_count:
          formData.get("hide_like_count") === "on",
        sensitive_content:
          formData.get("sensitive_content") === "on",
        training_visual_style: trainingVisualStyle,
      })
      .select("id")
      .single();

    if (postError) {
      throw postError;
    }
    const createdPostId = post.id;
    postId = createdPostId;

    for (const [position, file] of files.entries()) {
      const uploaded = await uploadPostMedia(
        user.id,
        createdPostId,
        file,
      );
      uploadedPaths.push(uploaded.path);

      const { error: mediaError } = await supabase
        .from("post_media")
        .insert({
          post_id: createdPostId,
          user_id: user.id,
          storage_path: uploaded.path,
          media_type: uploaded.kind,
          mime_type: file.type,
          position,
          alt_text:
            String(formData.get(`alt_${position}`) ?? "") ||
            null,
        });
      if (mediaError) {
        throw mediaError;
      }
    }

    for (const name of new Set(hashtags)) {
      let { data: hashtag, error: hashtagError } =
        await supabase
          .from("hashtags")
          .select("id")
          .eq("name", name)
          .maybeSingle();

      if (hashtagError) {
        throw hashtagError;
      }
      if (!hashtag) {
        const inserted = await supabase
          .from("hashtags")
          .insert({ name })
          .select("id")
          .single();

        if (
          inserted.error?.code === "23505"
        ) {
          const existing = await supabase
            .from("hashtags")
            .select("id")
            .eq("name", name)
            .single();
          hashtag = existing.data;
          hashtagError = existing.error;
        } else {
          hashtag = inserted.data;
          hashtagError = inserted.error;
        }
      }
      if (hashtagError || !hashtag) {
        throw (
          hashtagError ??
          new Error(`Could not save hashtag #${name}.`)
        );
      }

      const { error: relationError } = await supabase
        .from("post_hashtags")
        .insert({
          post_id: createdPostId,
          hashtag_id: hashtag.id,
        });
      if (relationError) {
        throw relationError;
      }
    }

    const taggedUsernames = [
      ...new Set(
        String(formData.get("tagged_users") ?? "")
          .match(/@([a-zA-Z0-9._]{3,30})/g)
          ?.map((value) => value.slice(1)) ?? [],
      ),
    ].slice(0, 20);

    if (taggedUsernames.length) {
      const { data: people, error: peopleError } =
        await supabase
          .from("profiles")
          .select("id")
          .in("username", taggedUsernames);
      if (peopleError) {
        throw peopleError;
      }
      if (people?.length) {
        const { error: tagsError } = await supabase
          .from("post_tags")
          .insert(
            people.map((person) => ({
              post_id: createdPostId,
              tagged_user_id: person.id,
              tagged_by_user_id: user.id,
            })),
          );
        if (tagsError) {
          throw tagsError;
        }
      }
    }

    const spotifyUrl = String(
      formData.get("spotify_url") ?? "",
    ).trim();
    if (spotifyUrl) {
      try {
        const { validateSpotifyUrl } =
          await import("@/lib/spotify/validators");
        const validUrl = validateSpotifyUrl(spotifyUrl);

        if (!validUrl) {
          console.error(
            "[PSFIT COMMUNITY: saving post music]",
            {
              message: "Invalid Spotify URL.",
              code: "VALIDATION",
              details: undefined,
              hint: undefined,
            },
          );
        } else {
          const spotifyPathType = new URL(validUrl).pathname
            .split("/")
            .filter(Boolean)[0];
          const contentType = [
            "track",
            "album",
            "playlist",
            "episode",
          ].includes(spotifyPathType)
            ? spotifyPathType
            : null;
          const { error: musicError } = await supabase
            .from("post_music")
            .insert({
              post_id: createdPostId,
              spotify_url: validUrl,
              title:
                String(
                  formData.get("spotify_title") ?? "",
                ).trim() || null,
              artist_name:
                String(
                  formData.get("spotify_artist") ?? "",
                ).trim() || null,
              artwork_url:
                String(
                  formData.get("spotify_artwork") ?? "",
                ).trim() || null,
              embed_url:
                String(
                  formData.get("spotify_embed") ?? "",
                ).trim() || null,
              content_type: contentType,
            });

          if (musicError) {
            console.error(
              "[PSFIT COMMUNITY: saving post music]",
              {
                message: musicError.message,
                code: musicError.code,
                details: musicError.details,
                hint: musicError.hint,
              },
            );
          }
        }
      } catch (musicError) {
        const details = getErrorDetails(musicError);
        console.error(
          "[PSFIT COMMUNITY: saving post music]",
          details,
        );
      }
    }
  } catch (error) {
    logCreatePostError(error);

    if (postId && supabase) {
      await rollbackPost(supabase, postId, uploadedPaths);
    }

    return createPostErrorState(error);
  }

  revalidatePath("/community");
  redirect(`/community/post/${postId}`);
}

export async function createMoment(formData: FormData) {
  const { supabase, user } = await userClient();
  const file = formData.get("media");
  const text = String(
    formData.get("text_content") ?? "",
  ).trim();
  const id = crypto.randomUUID();
  let mediaPath: string | null = null;
  let mediaType = String(formData.get("media_type") ?? "text");
  if (file instanceof File && file.size) {
    const uploaded = await uploadStoryMedia(user.id, id, file);
    mediaPath = uploaded.path;
    mediaType = uploaded.kind;
  }
  if (!mediaPath && !text) {
    throw new Error("Add media or text to your Moment.");
  }
  const { error } = await supabase.from("stories").insert({
    id,
    user_id: user.id,
    media_path: mediaPath,
    media_type: mediaType,
    text_content: text || null,
    caption: String(formData.get("caption") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    visibility: String(
      formData.get("visibility") ?? "followers",
    ),
    music_url:
      String(formData.get("spotify_url") ?? "") || null,
    music_provider: formData.get("spotify_url")
      ? "spotify"
      : null,
    music_title:
      String(formData.get("spotify_title") ?? "") || null,
    music_artist:
      String(formData.get("spotify_artist") ?? "") || null,
    music_artwork_url:
      String(formData.get("spotify_artwork") ?? "") || null,
  });
  if (error) {
    if (mediaPath) await deletePostMedia([mediaPath]);
    throw error;
  }
  revalidatePath("/community");
  redirect("/community");
}

export async function toggleLike(postId: string) {
  const { supabase } = await userClient();
  const { data, error } = await supabase.rpc(
    "toggle_post_like",
    { p_post_id: postId },
  );
  if (error) throw error;
  revalidatePath("/community");
  return Boolean(data);
}

export async function toggleSave(postId: string) {
  const { supabase } = await userClient();
  const { data, error } = await supabase.rpc(
    "toggle_saved_post",
    { p_post_id: postId },
  );
  if (error) throw error;
  return Boolean(data);
}

export type DeletePostResult = {
  ok: boolean;
  error?: string;
};

export async function deleteCommunityPost(
  postId: string,
): Promise<DeletePostResult> {
  try {
    const { supabase, user } = await userClient();
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (postError) throw postError;
    if (!post) {
      return {
        ok: false,
        error: "Post not found or you do not have permission to delete it.",
      };
    }

    const { data: media, error: mediaError } = await supabase
      .from("post_media")
      .select("storage_path")
      .eq("post_id", post.id)
      .eq("user_id", user.id);
    if (mediaError) throw mediaError;

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", user.id);
    if (deleteError) throw deleteError;

    const mediaPaths = (media ?? [])
      .map((item) => item.storage_path)
      .filter((path): path is string => Boolean(path));
    try {
      await deletePostMedia(mediaPaths);
    } catch (error) {
      logCreatePostError(error, "post media cleanup failed");
    }

    revalidatePath("/community");
    revalidatePath("/community/following");
    revalidatePath("/community/explore");
    revalidatePath("/community/saved");
    revalidatePath(`/community/post/${post.id}`);
    revalidatePath("/u/[username]", "page");

    return { ok: true };
  } catch (error) {
    logCreatePostError(error, "delete post");
    return {
      ok: false,
      error: "We could not delete this post. Please try again.",
    };
  }
}

export async function followUser(userId: string) {
  const { supabase } = await userClient();
  const { data, error } = await supabase.rpc("follow_user", {
    p_user_id: userId,
  });
  if (error) throw error;
  return String(data);
}

export async function markActivityRead() {
  const { supabase } = await userClient();
  await supabase.rpc("mark_notifications_read");
  revalidatePath("/community/activity");
}

export async function addComment(formData: FormData) {
  const { supabase, user } = await userClient();
  const postId = String(formData.get("post_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > 1000) {
    throw new Error(
      "Comments must contain 1–1,000 characters.",
    );
  }
  const { error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      body,
    });
  if (error) throw error;
  revalidatePath(`/community/post/${postId}`);
}

export async function updateProfile(
  _previousState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  let username = "";
  let newAvatarPath: string | null = null;

  try {
    const { supabase, user } = await userClient();
    username = usernameSchema.parse(
      String(formData.get("username") ?? ""),
    );
    const avatar = formData.get("avatar");
    const removeAvatar =
      formData.get("remove_avatar") === "true";
    const { data: currentProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .single();
    if (profileError) throw profileError;

    let avatarPath = currentProfile.avatar_path as string | null;
    let avatarUrl: string | null | undefined;

    if (avatar instanceof File && avatar.size > 0) {
      const extensions: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const extension = extensions[avatar.type];
      if (!extension) {
        return {
          ok: false,
          error: "Use a JPG, PNG or WebP image.",
        };
      }
      if (avatar.size > 5 * 1024 * 1024) {
        return {
          ok: false,
          error: "Profile photos must be 5 MB or smaller.",
        };
      }

      newAvatarPath = `${user.id}/avatar-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newAvatarPath, avatar, {
          contentType: avatar.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      avatarUrl = supabase.storage
        .from("avatars")
        .getPublicUrl(newAvatarPath).data.publicUrl;
      avatarPath = newAvatarPath;
    } else if (removeAvatar) {
      avatarPath = null;
      avatarUrl = null;
    }

    const profileSong = String(
      formData.get("spotify_url") ?? "",
    );
    const update = {
      username,
      full_name: String(formData.get("full_name") ?? "").slice(0, 100),
      bio: String(formData.get("bio") ?? "").slice(0, 500) || null,
      pronouns:
        String(formData.get("pronouns") ?? "").slice(0, 50) || null,
      location:
        String(formData.get("location") ?? "").slice(0, 100) || null,
      website:
        String(formData.get("website") ?? "").slice(0, 300) || null,
      profile_category:
        String(formData.get("profile_category") ?? "") || null,
      primary_goal:
        String(formData.get("primary_goal") ?? "").slice(0, 100) ||
        null,
      experience_level:
        String(formData.get("experience_level") ?? "").slice(0, 50) ||
        null,
      is_private: formData.get("is_private") === "on",
      show_momentum_score:
        formData.get("show_momentum_score") === "on",
      show_workout_stats:
        formData.get("show_workout_stats") === "on",
      profile_song_url: profileSong || null,
      profile_song_provider: profileSong ? "spotify" : null,
      profile_song_title:
        String(formData.get("spotify_title") ?? "") || null,
      profile_song_artist:
        String(formData.get("spotify_artist") ?? "") || null,
      profile_song_artwork_url:
        String(formData.get("spotify_artwork") ?? "") || null,
      ...(avatarUrl !== undefined
        ? { avatar_url: avatarUrl, avatar_path: avatarPath }
        : {}),
    };
    const { error: updateError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);
    if (updateError) {
      if (newAvatarPath) {
        await supabase.storage
          .from("avatars")
          .remove([newAvatarPath]);
      }
      throw updateError;
    }

    const oldAvatarPath = currentProfile.avatar_path as string | null;
    if (
      oldAvatarPath &&
      (removeAvatar || newAvatarPath) &&
      oldAvatarPath !== newAvatarPath
    ) {
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([oldAvatarPath]);
      if (deleteError) {
        logCreatePostError(deleteError, "PROFILE: old avatar removal");
      }
    }
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("[PSFIT PROFILE: avatar upload]", details);
    return {
      ok: false,
      error:
        details.message.includes("bucket")
          ? "Profile photo storage is not configured."
          : "We could not save your profile. Please try again.",
    };
  }

  revalidatePath("/community");
  revalidatePath("/community/following");
  revalidatePath("/community/explore");
  revalidatePath("/settings/profile");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}`);
}

export async function createHighlight(formData: FormData) {
  const { supabase, user } = await userClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 30) {
    throw new Error(
      "Highlight names use 1–30 characters.",
    );
  }
  const { error } = await supabase
    .from("story_highlights")
    .insert({ user_id: user.id, name });
  if (error) throw error;
  revalidatePath("/community/highlights/edit");
}
