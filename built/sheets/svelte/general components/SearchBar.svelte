<script>
    import { clickOutside } from './clickOutside.js';
    import SearchBar from "./SearchBar.svelte";
    import { setContext, afterUpdate } from 'svelte';
    import { writable, derived } from 'svelte/store';

    let input;
    let index;
    let selectionStart;
    afterUpdate(() => {
        if (input) {
            input.focus();
        }
    });
    let value = '';
    let str = writable({ value, index });
    let valArr = derived(str, $str => $str.value.split(";"));
    let isFocused = false;
    const words = ["magical fire", "physical fire", 'magical water', 'physical water'];
    setContext('words', words);
    setContext('value', str);
    setContext('valArr', valArr);


</script>
<div className="container" use:clickOutside on:outclick={()=>{isFocused=false}}>
    <input bind:this={input} bind:value={$str.value}
           on:input={(event)=>{$str.index=[...$str.value.substring(0,event.target.selectionStart+1).matchAll(";")].length}}
           on:click={(event)=>{$str.index=[...$str.value.substring(0,event.target.selectionStart+1).matchAll(";")].length;isFocused=true}}
           on:focus={(event)=>{$str.index=[...$str.value.substring(0,event.target.selectionStart+1).matchAll(";")].length}}
    />

    <svelte:component this={SearchBar} {isFocused}/>
</div>
<style>

</style>