'use client'

import { useState, useEffect, useRef } from "react"
import { VStack, Box, Text } from "@chakra-ui/react"
import { useScenario } from "@/lib/use-scenario"
import type { ScenarioItem } from "@/lib/scenarios"

export default function Scenario() {
  const { currentScenario } = useScenario()
  const [displayedScenario, setDisplayedScenario] = useState<ScenarioItem | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const headline = displayedScenario?.headline ?? "Una red de insulina falsificada contamina el suministro regional."
  const body = displayedScenario?.body ?? "Insulina falsificada, cuyo origen se ha rastreado hasta laboratorios en la frontera con Myanmar, ha entrado en la cadena de suministro regional, y el número de fallecimientos va en aumento. Tailandia atribuye la situación a la laxa supervisión de Myanmar; por su parte, Myanmar niega que los laboratorios se encuentren en su territorio. Arabia Saudita, un importante comprador, ha suspendido todas las importaciones de la región. México, cuya empresa posee la licencia del producto auténtico, controla la única prueba capaz de distinguir entre la insulina legítima y la falsificada, y está racionando su uso."

  useEffect(() => {
    if (!currentScenario || !overlayRef.current || !videoRef.current) return

    

    const timer = setTimeout(() => {
      if (overlayRef.current && videoRef.current) {
        overlayRef.current.style.display = 'block'
        videoRef.current.currentTime = 0
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true
              videoRef.current.play().catch((e) => console.warn('Autoplay failed:', e))
            }
          })
        }
        videoRef.current.pause()
      }
    }, 2000)

    const timerToScenario = setTimeout(() => {
      setDisplayedScenario(currentScenario)
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none'
      }
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }, 4000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timerToScenario)
    }
  }, [currentScenario])

  return (
    <>
      <Box
        ref={overlayRef}
        position="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        zIndex={9999}
        display="none"
        bg="black"
      >
        <video
          ref={videoRef}
          src="/vecteezy_damaged-tv-noise_3547419.mp4"
          playsInline
          preload="auto"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      <VStack p="5vh" minH={"100dvh"} minW={'100dvw'} align={"stretch"} gap={'2vh'}>
        <Text fontSize={"64px"} color={'gray.800'} textTransform={'capitalize'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
          {headline}
        </Text>
        <Text fontSize={"36px"} color={'gray.800'} fontFamily='var(--font-jetbrains-mono)' fontWeight={300}>
          {body}
        </Text>
      </VStack>
    </>
  )
}