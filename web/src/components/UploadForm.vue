<script setup>
import { httpsCallable } from "firebase/functions";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { ref } from "vue";
import { functions, storage } from "../firebase.js";

const props = defineProps({ user: { type: Object, required: true } });

const file = ref(null);
const status = ref("");
const busy = ref(false);

const processUpload = httpsCallable(functions, "processUpload");

async function upload() {
  if (!file.value) return;
  busy.value = true;
  try {
    const uploadId = crypto.randomUUID();
    status.value = "Uploading…";
    await uploadBytes(
      storageRef(storage, `uploads/${props.user.uid}/${uploadId}/original.jpg`),
      file.value,
      { contentType: "image/jpeg" },
    );
    status.value = "Cropping and signing…";
    await processUpload({ uploadId, fileName: file.value.name });
    status.value = "Done. It's in the list below.";
  } catch (uploadError) {
    status.value = uploadError.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="space-y-3 rounded-lg border border-gray-200 bg-white p-6" @submit.prevent="upload">
    <h2 class="font-medium">Upload a JPEG</h2>
    <p class="text-sm text-gray-500">
      It will be cropped to a 500×500 square and signed with a C2PA manifest.
    </p>
    <div class="flex items-center gap-3">
      <label
        class="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
      >
        Choose file
        <input
          type="file"
          accept="image/jpeg"
          class="hidden"
          @change="file = $event.target.files[0]"
        />
      </label>
      <span class="truncate text-sm text-gray-600">{{ file?.name ?? "No file chosen" }}</span>
    </div>
    <button
      type="submit"
      :disabled="busy || !file"
      class="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {{ busy ? "Working…" : "Upload" }}
    </button>
    <p v-if="status" class="text-sm text-gray-600">{{ status }}</p>
  </form>
</template>
