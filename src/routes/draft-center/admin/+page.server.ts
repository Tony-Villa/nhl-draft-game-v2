import { dev } from "$app/environment";
import { redirect } from "@sveltejs/kit";

export function load() {
  if(!dev) {
    return redirect(302, "/draft-center")
  }
}