import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://kksaid.vercel.app/",
  author: "Carlos Kirui",
  desc: "The digital hub for my refelctions - bite-sized, easy-to-digest content for curious minds.",
  title: "CK Said",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = []; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/carloskim123",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/somedev99",
    linkTitle: `${SITE.title} on Instagram`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:carloskirui154@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
];
