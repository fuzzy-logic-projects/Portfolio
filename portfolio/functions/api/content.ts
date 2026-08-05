interface Env {
  PORTFOLIO_KV: KVNamespace;
}

const DEFAULT_HOME = {
  name: 'Your name',
  role: '',
  tagline: 'Add your headline from the admin dashboard.',
  bio: 'Add a short bio from the admin dashboard at /admin.',
  email: '',
  education: [],
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [home, categories, projects, customCss] = await Promise.all([
    env.PORTFOLIO_KV.get('content:home'),
    env.PORTFOLIO_KV.get('content:categories'),
    env.PORTFOLIO_KV.get('content:projects'),
    env.PORTFOLIO_KV.get('content:customCss'),
  ]);

  return Response.json({
    home: home ? JSON.parse(home) : DEFAULT_HOME,
    categories: categories ? JSON.parse(categories) : [],
    projects: projects ? JSON.parse(projects) : [],
    customCss: customCss ?? '',
  });
};
