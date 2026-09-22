'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

/**
 * Carte interactive (Leaflet + tuiles OpenStreetMap) pour les questions « Carte ».
 * Ce composant n'est jamais importé directement : `next/dynamic` avec `ssr: false` l'exclut
 * du rendu serveur, Leaflet ayant besoin de `window`/`document` dès son chargement.
 *
 * Les marqueurs reprennent le vocabulaire visuel du site (pastille encre + accent) plutôt
 * que l'icône Leaflet par défaut, pour rester cohérent avec la DA malgré des tuiles OSM
 * forcément « réalistes ».
 *
 * La carte Leaflet n'est créée qu'UNE fois (effet à dépendances vides, jamais recréée quand
 * `readOnly`/`value`/`reference` changent) : la faire dépendre d'une prop qui change en cours
 * de vie (ex. `readOnly` qui passe à `true` à la correction) la détruirait et la recréerait,
 * et les marqueurs déjà posés (gérés par des effets séparés, à leurs propres dépendances) ne
 * seraient pas forcément re-créés dans la foulée — ils resteraient accrochés à l'ancienne
 * carte détruite, donc invisibles. Seul l'écouteur de clic réagit à `readOnly`.
 */

const pinIcon = (color: string) =>
  L.divIcon({
    className: 'kh-map-pin',
    html: `<span style="--pin-color:${color}"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });

export interface MapPickerProps {
  /** Point choisi par le joueur/l'auteur. */
  value: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  /** Second point affiché (ex. bonne réponse pendant la correction), jamais cliquable. */
  reference?: { lat: number; lng: number } | null;
  readOnly?: boolean;
  className?: string;
}

export function MapPicker({ value, onPick, reference, readOnly, className }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const valueMarker = useRef<L.Marker | null>(null);
  const referenceMarker = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Créée une seule fois : voir le commentaire d'en-tête.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { attributionControl: true, zoomControl: true }).setView(
      value ? [value.lat, value.lng] : [20, 10],
      value ? 5 : 2,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      valueMarker.current = null;
      referenceMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écouteur de clic séparé : (dés)activé sans jamais toucher à la carte elle-même.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || readOnly) return;
    const handleClick = (event: L.LeafletMouseEvent) => {
      onPickRef.current?.(Number(event.latlng.lat.toFixed(4)), Number(event.latlng.lng.toFixed(4)));
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [readOnly]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (value) {
      if (valueMarker.current) {
        valueMarker.current.setLatLng([value.lat, value.lng]);
      } else {
        valueMarker.current = L.marker([value.lat, value.lng], { icon: pinIcon('var(--accent, #ff8ad1)'), keyboard: false }).addTo(map);
      }
    } else if (valueMarker.current) {
      valueMarker.current.remove();
      valueMarker.current = null;
    }
  }, [value]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (reference) {
      if (referenceMarker.current) {
        referenceMarker.current.setLatLng([reference.lat, reference.lng]);
      } else {
        referenceMarker.current = L.marker([reference.lat, reference.lng], { icon: pinIcon('#16133b'), keyboard: false }).addTo(map);
      }
      const bounds = value
        ? L.latLngBounds([reference.lat, reference.lng], [value.lat, value.lng])
        : L.latLngBounds([reference.lat, reference.lng], [reference.lat, reference.lng]);
      map.fitBounds(bounds.pad(0.5), { maxZoom: 8 });
    } else if (referenceMarker.current) {
      referenceMarker.current.remove();
      referenceMarker.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return <div ref={containerRef} className={className ?? 'kh-map'} role="group" aria-label="Carte interactive : touche pour placer un repère" />;
}

export default MapPicker;
