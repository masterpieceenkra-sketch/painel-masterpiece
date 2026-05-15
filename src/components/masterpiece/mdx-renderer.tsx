import { MDXRemote } from "next-mdx-remote/rsc";
import { Callout } from "./Callout";
import { Step } from "./Step";
import { VideoEmbed } from "./VideoEmbed";
import { Checklist } from "./Checklist";

const components = {
  Callout,
  Step,
  VideoEmbed,
  Checklist,
};

export function MdxRenderer({
  source,
  playbookId,
}: {
  source: string;
  playbookId: string;
}) {
  // Inject playbookId into Checklist usages by passing as scope
  return (
    <div className="prose-masterpiece">
      <MDXRemote
        source={source}
        components={{
          ...components,
          Checklist: () => <Checklist playbookId={playbookId} />,
        }}
      />
    </div>
  );
}
