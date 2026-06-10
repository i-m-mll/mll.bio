"use client"

import { useState, useEffect } from 'react';

type MediaQuerySubscriber = (matches: boolean) => void

interface MediaQueryStore {
  media: MediaQueryList
  subscribers: Set<MediaQuerySubscriber>
  listener: (event: MediaQueryListEvent) => void
}

const mediaQueryStores = new Map<string, MediaQueryStore>()

function getMediaQueryMatch(query: string): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia(query).matches
}

function subscribeMediaQuery(query: string, subscriber: MediaQuerySubscriber) {
  let store = mediaQueryStores.get(query)

  if (!store) {
    const media = window.matchMedia(query)
    const subscribers = new Set<MediaQuerySubscriber>()
    const listener = (event: MediaQueryListEvent) => {
      subscribers.forEach(currentSubscriber => currentSubscriber(event.matches))
    }

    media.addEventListener('change', listener)
    store = { media, subscribers, listener }
    mediaQueryStores.set(query, store)
  }

  store.subscribers.add(subscriber)
  subscriber(store.media.matches)

  return () => {
    store.subscribers.delete(subscriber)

    if (store.subscribers.size === 0) {
      store.media.removeEventListener('change', store.listener)
      mediaQueryStores.delete(query)
    }
  }
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => getMediaQueryMatch(query));

  useEffect(() => {
    return subscribeMediaQuery(query, setMatches);
  }, [query]);

  return matches;
}
