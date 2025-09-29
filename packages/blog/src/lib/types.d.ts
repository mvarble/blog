export interface NavigationLink {
    title: string;
    slug: string;
    sections?: {
        title: string;
        path?: string;
        sections: {
            title: string;
            path?: string;
            sections: {
                title: string;
                path: string;
                badge?: string;
            }[];
        }[];
    }[];
}
