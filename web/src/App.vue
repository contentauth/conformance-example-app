<script setup>
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref } from "vue";
import { auth } from "./firebase.js";
import AssetList from "./components/AssetList.vue";
import SignInForm from "./components/SignInForm.vue";
import UploadForm from "./components/UploadForm.vue";

const user = ref(null);
const ready = ref(false);

onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser;
  ready.value = true;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <h1 class="text-lg font-semibold">CropSign</h1>
        <button
          v-if="user"
          class="text-sm text-gray-500 hover:text-gray-900"
          @click="signOut(auth)"
        >
          Sign out ({{ user.email }})
        </button>
      </div>
    </header>

    <main v-if="ready" class="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <SignInForm v-if="!user" />
      <template v-else>
        <UploadForm :user="user" />
        <AssetList :user="user" />
      </template>
    </main>
  </div>
</template>
