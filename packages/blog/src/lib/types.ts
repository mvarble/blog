import type { Component } from 'svelte';
import type { PostInfo } from '@mvarble/mesearch-cms/presets/blog';

export interface PostInfoWithDescription extends PostInfo {
    description?: Component;
    image?: string;
}
