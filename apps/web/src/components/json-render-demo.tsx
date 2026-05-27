import { defineCatalog } from "@json-render/core";
import { defineRegistry, type Spec, Renderer } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { shadcnComponents } from "@json-render/shadcn";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";

const catalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Text: shadcnComponentDefinitions.Text,
    Badge: shadcnComponentDefinitions.Badge,
    Button: shadcnComponentDefinitions.Button,
  },
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,
    Badge: shadcnComponents.Badge,
    Button: shadcnComponents.Button,
  },
});

const demoSpec: Spec = {
  root: "root-card",
  elements: {
    "root-card": {
      type: "Card",
      props: {
        title: "JSON Render + shadcn",
        description: "This section is rendered from a JSON spec",
      },
      children: ["stack-main"],
    },
    "stack-main": {
      type: "Stack",
      props: {
        direction: "vertical",
        gap: "md",
      },
      children: ["title", "desc", "badge", "cta"],
    },
    title: {
      type: "Heading",
      props: {
        text: "Composable UI from JSON",
        level: "h3",
      },
    },
    desc: {
      type: "Text",
      props: {
        text: "Define components in a catalog and render them dynamically.",
        variant: "muted",
      },
    },
    badge: {
      type: "Badge",
      props: {
        text: "Live",
        variant: "secondary",
      },
    },
    cta: {
      type: "Button",
      props: {
        label: "Render Ready",
        variant: "secondary",
      },
    },
  },
};

export default function JsonRenderDemo() {
  return <Renderer spec={demoSpec} registry={registry} />;
}
