/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as comments from "../comments.js";
import type * as files from "../files.js";
import type * as friends from "../friends.js";
import type * as gallery from "../gallery.js";
import type * as imageMigration from "../imageMigration.js";
import type * as linkSuggestions from "../linkSuggestions.js";
import type * as links from "../links.js";
import type * as media from "../media.js";
import type * as pixelBoard from "../pixelBoard.js";
import type * as travel from "../travel.js";
import type * as users from "../users.js";
import type * as work from "../work.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  files: typeof files;
  friends: typeof friends;
  gallery: typeof gallery;
  imageMigration: typeof imageMigration;
  linkSuggestions: typeof linkSuggestions;
  links: typeof links;
  media: typeof media;
  pixelBoard: typeof pixelBoard;
  travel: typeof travel;
  users: typeof users;
  work: typeof work;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
