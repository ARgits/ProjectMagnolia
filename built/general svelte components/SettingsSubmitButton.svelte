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
    width:100%;
    flex-basis: fit-content;
  }
</style>