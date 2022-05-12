<script>
  export let setting;
  export let data;
  function SubmitSetting(setting, data) {
    game.settings.set("ard20", setting, data);
  }
</script>

<button class="submit" on:click={() => SubmitSetting(setting, data)}>Submit</button>
<style lang="scss">
  button.submit{
    width:calc(100% - 1em);
    flex-basis: fit-content;
    position:fixed;
    bottom:0px;
    margin-bottom: 1em;
}
</style>