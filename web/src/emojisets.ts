import google_sheet from "emoji-datasource-google/img/google/sheets-256/64.png";
import google_blob_sheet from "emoji-datasource-google-blob/img/google/sheets-256/64.png";
import twitter_sheet from "emoji-datasource-twitter/img/twitter/sheets-256/64.png";

import octopus_url from "../../static/generated/emoji/images-google-64/1f419.png";

import * as blueslip from "./blueslip";
import {user_settings} from "./user_settings";

import google_blob_css from "!style-loader?injectType=lazyStyleTag!css-loader!../generated/emoji-styles/google-blob-sprite.css";
import google_css from "!style-loader?injectType=lazyStyleTag!css-loader!../generated/emoji-styles/google-sprite.css";
import twitter_css from "!style-loader?injectType=lazyStyleTag!css-loader!../generated/emoji-styles/twitter-sprite.css";

type EmojiSet = {
    css: {use: () => void; unuse: () => void};
    sheet: string;
};

const emojisets = new Map<string, EmojiSet>([
    ["google", {css: google_css, sheet: google_sheet}],
    ["google-blob", {css: google_blob_css, sheet: google_blob_sheet}],
    ["twitter", {css: twitter_css, sheet: twitter_sheet}],
]);

// For `text` emoji set we fallback to `google` emoji set
// for displaying emojis in emoji picker and typeahead.
emojisets.set("text", emojisets.get("google")!);

let current_emojiset: EmojiSet | undefined;

async function fetch_emojiset(name: string, url: string): Promise<void> {
    return new Promise((resolve, _reject) => {
        const get_emojiset = (): void => {
            const sheet = new Image();
            sheet.addEventListener("load", () => {
                window.removeEventListener("online", get_emojiset);
                resolve();
            });
            sheet.addEventListener("error", () => {
                // If there's an error, try again when the browser is online
                window.addEventListener("online", get_emojiset);
                blueslip.warn(
                    `Failed to load emojiset ${name} from ${url}. A retry will be attempted when the browser is online.`,
                );
            });
            sheet.src = url;
        };

        get_emojiset();
    });
}

export async function select(name: string): Promise<void> {
    const new_emojiset = emojisets.get(name);
    if (new_emojiset === current_emojiset) {
        return;
    }

    if (!new_emojiset) {
        throw new Error("Unknown emojiset " + name);
    }

    await fetch_emojiset(name, new_emojiset.sheet);

    if (current_emojiset) {
        current_emojiset.css.unuse();
    }
    new_emojiset.css.use();
    current_emojiset = new_emojiset;
}

export function initialize(): void {
    void select(user_settings.emojiset);

    // Load the octopus image in the background, so that the browser
    // will cache it for later use.  Note that we hardcode the octopus
    // emoji to the old Google one because it's better.
    //
    // TODO: We should probably just make this work just like the Zulip emoji.
    const octopus_image = new Image();
    octopus_image.src = octopus_url;
}
