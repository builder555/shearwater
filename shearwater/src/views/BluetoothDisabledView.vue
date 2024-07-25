<script setup>
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
const isSafari = navigator.userAgent.toLowerCase().includes('safari') && !isChrome;
const isIOSNonBluefy = (navigator.userAgent.includes('iPhone')
                        || navigator.userAgent.includes('iPad')) && !navigator.userAgent.includes('bluefy');
</script>
<template>
  <div class="center centered">
    <div class="box">
      <h2>Web Bluetooth setting is required to connect to a dive computer</h2>
      <hr style="margin: 10px 0">
      <template v-if="isFirefox">
        <h3>Firefox does not support Web Bluetooth</h3>
        <p>
          Please use <a href="https://brave.com/" target="_blank">Brave</a> 
          or Google Chrome browser to enable Web Bluetooth.
        </p>
      </template>
      <template v-else-if="isIOSNonBluefy">
        <h3>Most iOS browsers do not support Web Bluetooth</h3>
        <p>
          Please use <a href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055">Bluefy</a> 
          browser to access Web Bluetooth.
        </p>
      </template>
      <template v-else-if="isChrome">
        To enable bluetooth:
        <br/><br/>
        <ul>
          <li>
            <p>Open a new tab, and navigate to <strong>chrome://flags</strong> page</p>
            <p><img src="@/assets/bt-enable-step1.png" width="80%"/></p>
          </li>
          <li>
            <p>Search for "bluetooth" to find <strong>Web Bluetooth API</strong> setting 
              <br>and change "Default (disabled)" option to "<strong>Enabled</strong>"</p>
            <p><img src="@/assets/bt-enable-step2.png" width="80%"/></p>
          </li>
          <li>
            <p>Click "Relaunch" at the bottom of the page</p>
            <p><img src="@/assets/bt-enable-step3.png" width="80%"/></p>
          </li>
        </ul> 
        
      </template>
      <template v-else-if="isSafari">
        <h3>Safari does not support Web Bluetooth</h3>
        <p>
          Please use <a href="https://brave.com/" target="_blank">Brave</a> 
          or Google Chrome browser to enable Web Bluetooth.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
li img {
  max-width: 100%;
  height: auto;
  margin: 5px auto 25px auto;
  border-radius: 10px;
  border: 2px solid #000;
  background-color: #fff;
  padding: 5px;
  clear:both;
  display:block;
}
.box {
  max-width: 600px;
  width: 95%;
  padding: 20px;
  text-align: center;
  border-radius: 10px;
  border: 2px solid #000;
  background-color: #fff;
}
.centered {
  padding:10px 0;
  flex:1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>