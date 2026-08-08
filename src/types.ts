export interface EducationEntry {
  id: string;
  qualification: string;
  institution: string;
  years: string;
}

export interface HomeContent {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  about: string;
  email: string;
  education: EducationEntry[];
}

export interface Category {
  id: string;
  code: string;
  name: string;
  slug: string;
}

export interface ProjectFile {
  name: string;
  url: string;
}

export interface Project {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  description: string;
  link: string;
  date: string;
  files: ProjectFile[];
  articleType?: string;
}

export interface SiteContent {
  home: HomeContent;
  categories: Category[];
  projects: Project[];
  customCss: string;
}
