<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import ConfigureItemButton from "../general components/ConfigureItemButton.svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  function ShowDescription(event) {
    const parent = event.target.parentNode.parentNode;
    const div = parent.getElementsByClassName("description")[0];
    const isHidden = getComputedStyle(div).opacity == 0;
    div.style.webkitTransition = isHidden ? "opacity 1.5s" : "opacity 0.5s width 1.1"; //width transition little bit longer so you can't see that
    let divHeight;
    let parentHeight;
    //depend on <div> state we need different order of setting properties
    if (isHidden) {
      div.style.width = "100%";
      divHeight = div.offsetHeight;
      parentHeight = parent.offsetHeight;
    } else {
      divHeight = div.offsetHeight;
      parentHeight = parent.offsetHeight;
      div.style.width = "0%";
    }
    div.style.width = isHidden ? "100%" : "0%";
    if (!parent.style.height) parent.style.height = parentHeight + "px";
    div.style.opacity = isHidden ? 1 : 0;
    parent.style.height = isHidden ? parentHeight + divHeight + "px" : parentHeight - divHeight + "px";
    div.style.top = isHidden ? parentHeight + "px" : div.style.top;
  }
</script>

<table>
  <thead>
    <th>Name</th>
    <th>Level</th>
    <th colspan="3">Config. <ConfigureItemButton doc={$doc} type="feature" action="create" /></th>
  </thead>
  <tbody>
    {#each $doc.itemTypes.feature as item}
      <tr>
        <td>
          <span on:click={(event) => ShowDescription(event)}>
            {item.name}
          </span>
          {#if item.system.hasAttack || item.system.hasDamage}
            <i class="fa-light fa-dice-d20" data-tooltip="roll" />
          {/if}
        </td>
        <td>{item.system.level.current}</td>
        <td class="config"><ConfigureItemButton {item} action="edit" /></td>
        <td class="config"><i class="fa-solid fa-stars" /></td>
        <td class="config"><ConfigureItemButton {item} action="delete" /></td>
        <div class="description">
          <p>placeholder for description</p>
        </div>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  tr {
    position: relative;
    transition: height 1s;
    &:nth-of-type(odd) {
      background-color: transparent;
    }
    &:nth-of-type(even) {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  td {
    vertical-align: top;
    text-align: center;
    &.config {
      width: 5%;
    }
    &:not(.config) > i:hover {
      cursor: pointer;
      text-shadow: 0px 0px 10px red;
    }
  }
  div.description {
    width: 0%;
    left: 0px;
    background-color: rgb(255, 255, 255);
    border: 1px solid black;
    border-bottom: none;
    border-radius: 0px 0px 5px 5px;
    opacity: 0;
    position: absolute;
    transition: opacity 0.5s;
  }
</style>
