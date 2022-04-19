<svelte:options accessors={true} />

<script>
  import {setContext} from 'svelte'
  import {writable} from 'svelte/store'
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import FeatureComp from "./FeatureComp.svelte";
  import Tabs from "./Tabs.svelte";
  export let document
  let data = writable(document.system)
  setContext('data',data)
  let tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp},
    { label: "skills", id: "skills", component: SkillComp},
  ];
  let activeTab = "attributes";
  
</script>

<Tabs {tabs} {activeTab} />