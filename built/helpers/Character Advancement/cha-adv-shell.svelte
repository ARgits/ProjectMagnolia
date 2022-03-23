<svelte:options accessors={true} />
<script>
  import AttributeComp from './Attributes.svelte'
	import SkillComp from './Skills.svelte'
	import FeatureComp from './FeatureComp.svelte'
	import Tabs from './Tabs.svelte'
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot
	let tabs = [
			{label:'attributes', id:'attributes',component:AttributeComp},
			{label:'skills',id:'skills', component:SkillComp},
			{label:'features',id:'features',component:FeatureComp}
		]
    let activeTab='attributes'
</script>
<ApplicationShell bind:elementRoot>
  <Tabs {tabs} {activeTab}/>
</ApplicationShell>