<script setup>
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { onUnmounted, ref } from "vue";
import { db, storage } from "../firebase.js";

const props = defineProps({ user: { type: Object, required: true } });

const assets = ref([]);

const uploads = query(
  collection(db, "users", props.user.uid, "uploads"),
  orderBy("createdAt", "desc"),
);

const stopListening = onSnapshot(uploads, async (snapshot) => {
  assets.value = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const { fileName, originalPath, signedPath } = doc.data();
      return {
        id: doc.id,
        fileName,
        originalUrl: await getDownloadURL(storageRef(storage, originalPath)),
        signedUrl: await getDownloadURL(storageRef(storage, signedPath)),
      };
    }),
  );
});
onUnmounted(stopListening);
</script>

<template>
  <section class="rounded-lg border border-gray-200 bg-white p-6">
    <h2 class="font-medium">Your assets</h2>
    <p v-if="assets.length === 0" class="mt-2 text-sm text-gray-500">Nothing uploaded yet.</p>
    <ul v-else class="mt-2 divide-y divide-gray-100">
      <li v-for="asset in assets" :key="asset.id" class="flex items-center gap-4 py-3">
        <img :src="asset.signedUrl" alt="" class="h-12 w-12 rounded object-cover" />
        <span class="flex-1 truncate text-sm">{{ asset.fileName }}</span>
        <a
          :href="asset.originalUrl"
          target="_blank"
          class="text-sm text-blue-600 hover:underline"
        >
          Original
        </a>
        <a :href="asset.signedUrl" target="_blank" class="text-sm text-blue-600 hover:underline">
          Cropped + signed
        </a>
      </li>
    </ul>
  </section>
</template>
