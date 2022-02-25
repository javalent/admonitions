export type DownloadableIconPack = "octicons" | "rpg";

export const DownloadableIcons: Record<DownloadableIconPack, string> = {
    octicons: "Octicons",
    rpg: "RPG Awesome"
} as const;
