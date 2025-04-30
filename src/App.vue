<template>
  <div ref="LeafletMap" class="absolute z-0 top-0 left-0 w-screen h-screen bg-gray-800" />

  <div class="absolute z-30 top-4 left-4 bg-gray-900 backdrop-blur-md text-gray-100 p-3 rounded-lg shadow-md text-sm opacity-70">
    <a href="https://posgen.info" target="_blank" class="hover:underline font-semibold">
      🚀 Bu harita <span class="text-red-400">Posgen</span> ile güçlendirilmiştir
    </a>
  </div>

  <div
    class="absolute z-20 bottom-4 right-4 bg-gray-900/70 backdrop-blur-md text-gray-100 w-80 rounded-lg shadow-md text-sm overflow-hidden transition-all duration-300"
    :class="{ 'max-h-96': !isListOpen, 'h-auto': isListOpen }"
  >
    <div class="p-4 flex items-center justify-between">
      <h2 class="font-bold text-lg">📋 Son Depremler</h2>
      <button @click="toggleList" class="text-gray-300 hover:text-gray-100 focus:outline-none">
        <svg v-if="!isListOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <ul v-if="isListOpen || isDesktop" class="p-4 max-h-72 overflow-y-auto">
      <li v-for="(quake, index) in latestQuakes.slice(0, 10)" :key="index" class="mb-3 pb-2 border-b border-gray-700 last:border-b-0">
        <strong class="font-medium">{{ quake.konum }}</strong><br />
        Büyüklük: <strong class="text-yellow-400 font-bold">{{ quake.buyukluk }}</strong> - {{ quake.tarih.split('T')[0] }}
      </li>
    </ul>
    <div v-else class="p-4 text-center text-gray-400">
      Son 10 deprem (listeyi açmak için yukarıdaki oka tıklayın)
    </div>
  </div>

  <div class="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
    <Select v-model="viewStyle">
      <SelectTrigger class="bg-gray-700 hover:bg-gray-600 data-[placeholder]:text-gray-300 text-gray-100 px-4 py-2 rounded-md shadow-sm">
        <SelectValue placeholder="Görüntüleme Türü" class="text-gray-100" as-child>
          <Pin v-if="viewStyle == 'pin'" class="mr-2 h-4 w-4 inline-block" />
          <Circle v-else class="mr-2 h-4 w-4 inline-block" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent class="bg-gray-800 text-gray-100 rounded-md shadow-md overflow-hidden">
        <SelectGroup>
          <SelectItem value="pin" class="hover:bg-gray-700 px-4 py-2 cursor-pointer">
            <Pin class="mr-2 h-4 w-4 inline-block" /> İşaretçi
          </SelectItem>
          <SelectItem value="circle" class="hover:bg-gray-700 px-4 py-2 cursor-pointer">
            <Circle class="mr-2 h-4 w-4 inline-block" /> Daire
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>

<script lang="ts" setup>
import L from 'leaflet';
import { onMounted, ref, watchEffect } from 'vue';
import axios from 'axios';
import type Earthquake from 'types/Earthquake';
import { Circle, Pin } from 'lucide-vue-next';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { useColorMode, useMediaQuery } from '@vueuse/core';

const viewStyle = ref<"pin" | "circle">("circle");
const color = useColorMode();
color.value = 'dark';

const LeafletMap = ref<HTMLDivElement | null>(null);
const latestQuakes = ref<Earthquake[]>([]);
const isListOpen = ref(false);
const isDesktop = useMediaQuery('(min-width: 768px)');

const toggleList = () => {
  isListOpen.value = !isListOpen.value;
};

onMounted(async () => {
  if (!LeafletMap.value) return;

  const map = L.map(LeafletMap.value).setView([39, 35.5], 6);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const response = await axios<Earthquake[]>({
    baseURL: window.location.origin,
    url: '/api/get',
    params: {
      max: 500
    }
  });

  latestQuakes.value = response.data;

  const circleLayer = new L.LayerGroup();
  const pinLayer = new L.LayerGroup();

  for (let last of response.data) {
    const popup =
      `<strong>${last.konum}</strong>
    <ul>
      <li>Enlem: <strong>${last.enlem}</strong></li>
      <li>Boylam: <strong>${last.boylam}</strong></li>
      <li>Büyüklük: <strong class="text-yellow-400">${last.buyukluk}</strong></li>
      <li>Tür: <strong>${last.type.toUpperCase()}</strong></li>
      <li>Ölçüm Niteliği: <strong>${last.nitelik}</strong></li>
      <li>Saat: <strong>${last.saat}</strong></li>
      <li>Tarih: <strong>${new Date(last.tarih).toLocaleDateString()}</strong></li>
      <li>Derinlik: <strong>${last.derinlik_km} km</strong></li>
    </ul>`;

    L.circle([+last.enlem, +last.boylam], {
      radius: last.buyukluk * 5000,
      color: "#fca5a5",
      fillColor: '#f87171',
      fillOpacity: 0.7,
    }).addTo(circleLayer)
      .bindPopup(popup);

    const customIcon = L.divIcon({
      className: 'custom-pin-icon',
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-500"><path fill-rule="evenodd" d="M12 2a7 7 0 017 7c0 5.253-6.986 13-7 13-0.014-0-7-7.747-7-13a7 7 0 017-7zm0 2a5 5 0 00-5 5c0 4.253 5.986 11 6 11 0.014 0 6-6.747 6-11a5 5 0 00-5-5z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M12 14a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg><span class="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-gray-100">${last.buyukluk}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });

    L.marker([+last.enlem, +last.boylam], { icon: customIcon })
      .addTo(pinLayer)
      .bindPopup(popup);
  }

  circleLayer.addTo(map);

  watchEffect(() => {
    if (viewStyle.value == 'circle') {
      map.removeLayer(pinLayer);
      circleLayer.addTo(map);
    } else {
      map.removeLayer(circleLayer);
      pinLayer.addTo(map);
    }
  });
});
</script>

<style>
.custom-pin-icon {
  background: none !important;
  border: none !important;
}

@media (max-width: 767px) {
  .max-h-96 {
    max-h: 120px !important; 
  }
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #6b7280; 
  border-radius: 4px; 
}

.overflow-y-auto::-webkit-scrollbar-track {
  background-color: #374151; 
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #4b5563; 
}
</style>