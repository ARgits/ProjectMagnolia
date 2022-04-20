<svelte:options accessors={true} />

<script>
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  setContext("chaAdvActorID", document.id);
  const data = writable({
	  attributes:duplicate(document.data.data.attributes),
	  skills:duplicate(document.data.data.skills)
  });
  console.log($data);
  setContext("chaAdvActorData", data);
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: SkillComp },
  ];
  const activeTab = "attributes";
</script>

<Tabs {tabs} {activeTab} />
