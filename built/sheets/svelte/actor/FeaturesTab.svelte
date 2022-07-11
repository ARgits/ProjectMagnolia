<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import ConfigureItemButton from "../general components/ConfigureItemButton.svelte";
  import ARd20Action from "../../../documents/action.js";
  import ActionSheet from "../action/actionSheet";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  function ShowDescription(event) {
    const parent = event.target.parentNode.parentNode;
    const div = parent.getElementsByClassName("description")[0];
    const isHidden = getComputedStyle(div).opacity == 0;
    div.style.webkitTransition = isHidden ? "opacity 0.75s" : "opacity 0.25s, width 1.1s"; //width transition little bit longer so you can't see that
    let divHeight;
    let parentHeight;
    div.style.width = isHidden ? "100%" : div.style.width; //if div was hidden, change width
    divHeight = div.offsetHeight;
    parentHeight = parent.offsetHeight;
    parent.style.height = parentHeight + "px";
    div.style.opacity = isHidden ? 1 : 0;
    parent.style.height = isHidden ? parentHeight + divHeight + "px" : parentHeight - divHeight + "px";
    div.style.top = isHidden ? parentHeight + "px" : div.style.top;
    div.style.width = isHidden ? "100%" : "0%"; //if div was visible, change width
  }
  function itemRoll(item) {
    const hasAttack = item.system.hasAttack;
    const hasDamage = item.system.hasDamage;
    return item.roll({ hasAttack, hasDamage });
  }
</script>

<table>
  <thead>
    <th>Name</th>
    <th>Actions</th>
    <th>Level</th>
    <th colspan="3">Config <ConfigureItemButton doc={$doc} type="feature" action="create" /></th>
  </thead>
  <tbody>
    {#each $doc.itemTypes.feature as item}
      <tr>
        <td>
          <span on:click={(event) => ShowDescription(event)}>
            {item.name}
          </span>
          {#if item.system.hasAttack || item.system.hasDamage}
            <i
              on:click={() => {
                itemRoll(item);
              }}
              class="fa-light fa-dice-d20"
              data-tooltip="roll"
            />
          {/if}
        </td>
        <td class="actions">
          <div class="actions">
            {#each item.system.actionList as action}
              <div class="action">
                <span
                  on:click={() => {
                    ARd20Action.use(action);
                  }}
                >
                  {action.name}
                </span>
                <i on:click={() => new ActionSheet(action).render(true, { focus: true })} class="fa-solid fa-pen-to-square" data-tooltip="edit" />
              </div>
            {/each}
          </div>
        </td>
        <td>{item.system.level.current}</td>
        <td class="config">
          <ConfigureItemButton {item} action="edit" />
        </td>
        <td class="config">
          <ConfigureItemButton {item} doc={$doc} type="feature" action="favorite" />
        </td>
        <td class="config">
          <ConfigureItemButton {item} action="delete" />
        </td>
        <div class="description">
          {@html item.system.description}
        </div>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  tr {
    position: relative;
    transition: height 0.7s;
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
  div.actions {
    display: flex;
    flex-direction: column;
  }
  div.description {
    width: 0%;
    left: 0px;
    background-color: rgb(255, 255, 255);
    border: 1px solid black;
    border-top: none;
    border-radius: 0px 0px 5px 5px;
    opacity: 0;
    position: absolute;
    transition: opacity 0.5s;
  }
</style>
