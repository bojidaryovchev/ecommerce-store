## General considerations

We should maintain a flat folder structure everywhere

We should only use `index.ts` exports for our components

There should be only one thing per file - one interface, one component, one type, one schema, one action, one enum, and so on, with the exception of utils and configs (living in the `src/lib`) folder as well as contexts and their providers (living in the `src/contexts` folder)

Constants should be more descriptive, e.g. `export const REFRESH_INTERVAL_MS = 60000;` instead of `export const REFRESH_INTERVAL = 60000;`

## Project structure

- `.husky` - husky hooks
- `.vscode` - project-level vscode configurations
- `docs` - documentation
- `prisma` - Prisma schema
- `public` - static assets (images, SEO-related files, etc.)
- `scripts` - helpful scripts
- `src/actions` - server actions
- `src/app` - Next.js App directory - pages, API routes, framework specifics
- `src/components` - components, each in its own folder
- `src/components/layouts` - common layouts
- `src/components/providers` - providers (different from React Context API, see below)
- `src/components/ui` - shadcn components
- `src/contexts` - contexts [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
- `src/hooks` - hooks
- `src/lib` - utils, configs, etc.
- `src/schemas` - Zod schemas
- `src/styles` - stylesheets
- `src/styles/index.css` - all stylesheet imports in a single place (then our root layout should import this file)
- `src/types` - types, interfaces and enums
- `src/typings` - typescript definitions (`.d.ts`)
- `src/constants.ts` - our constants and configs
- `src/middleware.ts` - Next.js middleware configuration
- `.env.example` - an example .env file, should be kept up-to-date
- `.gitignore` - git ignore
- `.prettierrc` - Prettier config
- `commitlint.config.js` - commitlint config
- `components.json` - ShadCN config
- `docker-compose.yml` - spawn a local MongoDB replica set by running `docker-compose up`
- `eslint.config.mjs` - ESLint config
- `mongo-keyfile` - a keyfile for our local MongoDB replica set
- `next.config.ts` - Next.js config
- `package.json` - our package json, we should stick to exact versions and use `scripts/update-dependencies.mjs` to keep our dependencies up-to-date
- `postcss.config.mjs` - PostCSS config
- `README.md` - project overview
- `STYLEGUIDE.md` - project style guide
- `tailwind.config.ts` - TailwindCSS config
- `tsconfig.json` - typescript config
- `vercel.json` - Vercel config

## Naming conventions

Constants that hold a hardcoded value (e.g. `const REFRESH_INTERVAL_MS = 60000`) should follow `SCREAMING_SNAKE_CASE`

Constants that hold a computed value should follow `camelCase`

Files should follow `kebab-case`

- components should be suffixed with `.component`, e.g. `articles.component.ts`
- client-side components should be suffixed with `-client`, e.g. `articles-client.component.ts`
- server actions should be prefixed with either `prisma-` or `fetch-`
- server actions should be suffixed with `.action`, e.g. `prisma-get-article-by-id.action.ts`
- schemas should be suffixed with `.schema`, e.g. `contact-form.schema.ts`
- interfaces should be suffixed with `.interface`, e.g. `paginated-result.interface.ts`
- types should be suffixed with `.type`, e.g. `action-result.type.ts`
- enums should be suffixed with `.enum`, e.g. `user-role.enum.ts`
- hooks should be prefixed with `use-` and suffixed with `.hook`, e.g. `use-articles.hook.ts`

## Components

- each component should live in its own folder, e.g. `src/components/FooBar`
- each component should encapsulate everything related to it in that folder
- each component folder should contain an `index.ts` file
- each component folder `index.ts` file should contain a named default export of the component, e.g. `export { default as FooBar } from "./foo-bar";`, as well as an export for anything we might want to expose to the outside world
- components are server-side by default unless we explicitly mark them as client-side using the `"use client";` directive
- client-side components should be suffixed with `-client` to directly indicate they are client-side, e.g. `articles-client.component.ts`

We should use our code snippets (found in `.vscode/component.code-snippets`) to generate our components by typing `r-component` and pressing tab

The props of a component should always be defined as an interface called `Props` that sits directly above the component definition so it's easy to see it, for example:

```tsx
import React from "react";

interface Props {
  articles: Article[];
}

const ArticlesList: React.FC<Props> = ({ articles }) => {
  return <>{articles}</>;
};

export default ArticlesList;
```

If we also need to make use of the `children`, we should wrap our `Props` inside `PropsWithChildren<T>`, for example:

```tsx
import React, { PropsWithChildren } from "react";

interface Props {
  articles: Article[];
}

const ArticlesList: React.FC<PropsWithChildren<Props>> = ({ articles, children }) => {
  return (
    <>
      {articles}
      {children}
    </>
  );
};

export default ArticlesList;
```

Server-side components that are `async` and internally use `await` to fetch some data should be wrapped in a [suspense](https://react.dev/reference/react/Suspense) in order to display a loading indication while they are awaiting:

```tsx
import React from "react";

const ArticlesList: React.FC = async () => {
  const articles = await fetchArticles();
  return <>{articles}</>;
};

export default ArticlesList;
```

```tsx
<Suspense fallback={<Loading text="Loading articles..." />}>
  <ArticlesList />
</Suspense>
```

As a rule of thumb, we should start with a server component and only switch to a client one if we need interactivity, e.g. `useState`, `onClick`, etc.

A common pattern when interactivity is needed but we want to preserve our SEO capabilities is to have a server component which fetches the data server-side and passes it down to its client-side counterpart, for example:

```tsx
"use client";

import React from "react";

interface Props {
  articles: Article[];
}

const ArticlesListClient: React.FC<Props> = ({ articles }) => {
  return <>{articles}</>;
};

export default ArticlesListClient;
```

```tsx
import React from "react";

const ArticlesList: React.FC = async () => {
  const articles = await fetchArticles();
  return <ArticlesListClient articles={articles} />;
};

export default ArticlesList;
```

## Forms

We should use `react-hook-form` with `zod` for our forms

Each form should reside in a separate client-side component and have its own `zod` schema

In the submit handler we should perform a mutation and consume its `Promise<ActionResult<T>>`, extracting the response message

We should then use `react-hot-toast` to notify the user of the mutation outcome (using either `.success` or `.error`)

```tsx
const onSubmit = async ({ email, password }: RegisterFormInput) => {
  try {
    const result = await registerUser(email, password);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.success);
      onRegistrationSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }
};
```

## Server actions and revalidation

Our server actions pretty much fall within 2 categories - using `prisma` and using `fetch`

The `prisma` actions use the prisma client directly to interact with the database to either retrieve data or mutate it

They should use try catch for error handling and return a `Promise<ActionResult<T>>`, here's an example:

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { articleIdSchema } from "@/schemas/article-id-schema";
import type { ActionResult } from "@/types/action-result";
import type { Article } from "@prisma/client";

export async function prismaGetArticles(): Promise<ActionResult<Article[]>> {
  try {
    const articles = await prisma.article.findMany({
      where: { ... },
    });

    return {
      success: true,
      data: articles,
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch articles",
    };
  }
}

export async function prismaGetArticleById(id: string): Promise<ActionResult<Article>> {
  try {
    const validated = articleIdSchema.parse({ id });

    const article = await prisma.article.findUnique({
      where: { id: validated.id },
    });

    if (!article) {
      return {
        success: false,
        error: "Article not found",
      };
    }

    return {
      success: true,
      data: article,
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch article",
    };
  }
}
```

The `fetch` actions use fetch to shoot towards API routes or external APIs with the ability to act as a caching layer - see more below

They should throw errors as in the example below:

```ts
export const fetchArticles = async (): Promise<Serialized<Article>[]> => {
  const readonlyHeaders = await headers();
  const host = readonlyHeaders.get('host');
  const protocol = isRuntimeEnv('development') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/articles`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'force-cache',
    next: { tags: ['articles'], revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }

  const data = await response.json<Serialized<Article>[]>();
bojidaryovchev marked this conversation as resolved.

  return data;
};

export async function refreshArticles(): Promise<void> {
  revalidateTag('articles');
}

export const fetchArticleById = async (
  id: string
): Promise<ActionResult<Serialized<Article>>> => {
  const readonlyHeaders = await headers();
  const host = readonlyHeaders.get('host');
  const protocol = isRuntimeEnv('development') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/articles/id/${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'force-cache',
    next: { tags: [`article-id-${id}`], revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404 ? 'Article not found' : 'Failed to fetch article'
    );
  }

  const data = await response.json<ActionResult<Serialized<Article>>>();
bojidaryovchev marked this conversation as resolved.

  return data;
};

export async function refreshArticleById(id: string): Promise<void> {
  revalidateTag(`article-id-${id}`);
}
```

Each `fetch-` action should use tags for granular revalidation and expose a refresh action that invokes `revalidateTag`

In the example above we are caching our data for 60 seconds and by revalidating the tags we are refreshing it on demand

This whole approach allows us to define a caching layer with our core idea being to use `fetch-` actions for data retrieval and `prisma-` actions for data mutations

What happens generally is we have a server component where we fetch some data using a `fetch-` action to either render it directly or pass it down to a client-side component - we keep that data cached with some expiry duration and refresh it on demand whenever a form is submitted in a client-side component - as you can see in the `Forms` section, each form should reside in its own client-side component - each form has a submit handler inside of which we invoke a `prisma-` action to cause a mutation and usually inside of our `prisma-` action we invoke the `refresh` function we've defined in our `fetch-` action

When it comes to data fetching, we have 2 possibilities:

- server component → fetch server action → API route → prisma server action
- client component → swr hook → API route → prisma server action

In both cases we have caching in place - if it's a server component, it uses a `fetch-` action, and if it's a client component, it uses an SWR hook where we have the same ability to define a caching duration

We should fetch our data in server components [and pass it down] unless we have a specific case that explicitly requires us to fetch it purely client-side

Here is an example of a custom SWR hook for client-side fetching:

```ts
export const useArticles = (initialArticles: Article[]) => {
  const { isLoading, error, data, mutate } = useSWR<Serialized<Article>[]>("/api/articles", fetcher, {
    fallbackData: initialArticles,
    refreshInterval: REFRESH_INTERVAL_MS,
  });

  const refreshArticles = async () => {
    await mutate();
  };

  return {
    isLoading,
    error,
    data,
    refreshArticles,
  };
};
```

In this example you can see a nice pattern - passing down `initialArticles` (fetched server-side) as `fallbackData` and then continuing with client-side fetching after initial render and hydration

Also notice how we are using the `Serialized<T>` type:

```ts
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Array<infer U>
      ? Serialized<U>[]
      : T[K] extends object
        ? Serialized<T[K]>
        : T[K];
};
```

The data we fetch from our API routes undergoes serialization - for example, in our Prisma schema we have our dates defined as being of type `Date`, and when we use the Prisma client to retrieve our data (in our `prisma-` actions) we get the expected type `Date` back - nothing out of the ordinary

However, when we consume our data via either a fetch action or an swr hook (in both cases towards an API route) we get our dates as ISO strings - they have been serialized

To address this in a reusable manner, we've introduced the `Serialized<T>` type which takes a Prisma entity model and redefined its fields of type `Date` to be of type `string` (representing the ISO string format)

We should use it to ensure type-safety of serialized entities

## Global state via contexts

We should use the [React Context API](https://react.dev/learn/passing-data-deeply-with-context) for our global state management

Each context has one provider associated with it

Here is an example:

```tsx
"use client";

import { setCookie } from "cookies-next";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  sidebarExpanded: boolean;
  setSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface Props {
  initialSidebarExpanded: boolean;
}

export const SidebarProvider: React.FC<PropsWithChildren<Props>> = ({ initialSidebarExpanded, children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(initialSidebarExpanded);

  useEffect(() => {
    setCookie("sidebarExpanded", sidebarExpanded.toString());
  }, [sidebarExpanded]);

  return <SidebarContext.Provider value={{ sidebarExpanded, setSidebarExpanded }}>{children}</SidebarContext.Provider>;
};
```

## Providers

In React apps what usually ends up happening is us having our entire component tree wrapped in a bunch of providers, regardless whether they would be from a library or our own via the React Context API, so we end up with something like this:

```tsx
const RootLayout: React.FC<PropsWithChildren> = async ({ children }) => {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <AuthProviders>
          <AProviders>
            <BProviders>
              <CProviders>
                <DProviders>
                  <EProviders>
                    <FProviders>
                      <NProviders>{children}</NProviders>
                    </FProviders>
                  </EProviders>
                </DProviders>
              </CProviders>
            </BProviders>
          </AProviders>
        </AuthProviders>
      </body>
    </html>
  );
};
```

In this example we don't even have fetching or some further logic which is actually pretty common to go with some providers, so in order to keep this more manageable we have introduced the `src/components/providers` folder where each provider should have its own `-providers` component (e.g. `theme-providers.tsx`) where such additional logic should be handled

Then, we should have a `providers.tsx` component which acts as an entry point for all of our providers:

```tsx
const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <HtmlProviders>
      <AuthProviders>
        <AProviders>
          <BProviders>
            <CProviders>
              <DProviders>
                <EProviders>
                  <FProviders>
                    <NProviders>{children}</NProviders>
                  </FProviders>
                </EProviders>
              </DProviders>
            </CProviders>
          </BProviders>
        </AProviders>
      </AuthProviders>
    </HtmlProviders>
  );
};
```

Here is an example of a React Context API provider that requires some initial state fetching server-side, so we've extracted a providers component for it:

```tsx
import { getServerInitialSidebarExpanded } from "@/actions/sidebar.actions";
import { SidebarProvider } from "@/contexts/sidebar-context";
import React, { PropsWithChildren } from "react";

const SidebarProviders: React.FC<PropsWithChildren> = async ({ children }) => {
  const initialSidebarExpanded = await getServerInitialSidebarExpanded();
  return <SidebarProvider initialSidebarExpanded={initialSidebarExpanded === "true"}>{children}</SidebarProvider>;
};

export default SidebarProviders;
```

## SVG icons

We should keep our SVG icons as regular React components because this way we have full control over them in an easy-to-use manner

Each icon should have width and height of `1em` so we can control it externally via `font-size` (e.g. using `text-[1.25rem]`)

If an icon is branded (meaning it has specific colors that make it what it is) we do not need to worry about its `fill` and `stroke` properties, but, if it's not, we should use `currentColor` for them so that we can control the color externally via `color` (e.g. using `text-[#ff4422]`)

```tsx
import React from "react";

const AWSIcon: React.FC = () => {
  return (
    <>
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
        <path fill="#252f3e" d="M36.379 ..." />
        <path fill="#f90" d="M118 ..." />
      </svg>
    </>
  );
};

export default AWSIcon;
```

## Branch naming

We should name our branches like `34-style-guide` - board issue number, followed by the ticket name in `kebab-case`

We should name our commit messages like

- `feat: added new or extended existing business logic (#34)`
- `refactor: changed existing business logic (#34)`
- `chore: changed something that does not affect business logic (#34)`
- `fix: fixed an issue in the business logic (#34)`
- `docs: added new or extended existing documentation (#34)`
- `test: added new or extended existing tests (#34)`

We should name our PRs following the same convention as our commit messages
