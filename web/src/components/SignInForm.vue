<script setup>
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref } from "vue";
import { auth } from "../firebase.js";

const email = ref("");
const password = ref("");
const error = ref("");

async function submit(signInOrCreate) {
  error.value = "";
  try {
    await signInOrCreate(auth, email.value, password.value);
  } catch (authError) {
    error.value = authError.message;
  }
}
</script>

<template>
  <form
    class="mx-auto max-w-sm space-y-3 rounded-lg border border-gray-200 bg-white p-6"
    @submit.prevent="submit(signInWithEmailAndPassword)"
  >
    <h2 class="font-medium">Sign in</h2>
    <input
      v-model="email"
      type="email"
      required
      placeholder="Email"
      class="w-full rounded border border-gray-300 px-3 py-2"
    />
    <input
      v-model="password"
      type="password"
      required
      minlength="6"
      placeholder="Password"
      class="w-full rounded border border-gray-300 px-3 py-2"
    />
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        @click="submit(createUserWithEmailAndPassword)"
      >
        Create account
      </button>
      <button type="submit" class="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100">
        Sign in
      </button>
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </form>
</template>
