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

export interface DocumentSummary {
    title: string;
    pathname: string;
    children: DocumentSummary[];
}

export interface SequencePage {
    label?: string;
    title: string;
    pathname: string;
}
