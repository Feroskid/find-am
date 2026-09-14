import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/** Only pictures hosted on our own media domain are ever rendered. */
const ALLOWED_IMAGE_HOSTS = ["media.find-am.com"];

function isAllowedImage(src?: string) {
  if (!src) return false;
  try {
    const u = new URL(src, "https://find-am.com");
    return u.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function isInternal(href?: string) {
  if (!href) return true;
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    const h = new URL(href).hostname;
    return h === "find-am.com" || h === "www.find-am.com";
  } catch {
    return false;
  }
}

const schema = {
  ...defaultSchema,
  protocols: { ...defaultSchema.protocols, src: ["https"], href: ["http", "https", "mailto"] },
};

/** Renders a member's post text: images, links, bold, lists — never scripts. */
export function Markdown({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <div className="cm-prose text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          img: ({ src, alt }) =>
            isAllowedImage(typeof src === "string" ? src : undefined) ? (
              <img
                src={src as string}
                alt={alt ?? ""}
                loading="lazy"
                className="my-3 max-h-[26rem] w-auto rounded-xl border border-black/10"
              />
            ) : null,
          a: ({ href, children: kids }) =>
            isInternal(href) ? (
              <a href={href} className="text-[#E5A54B] font-medium underline break-words">
                {kids}
              </a>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="text-[#E5A54B] font-medium underline break-words"
              >
                {kids}
              </a>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
