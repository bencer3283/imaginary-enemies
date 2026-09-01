'use client'

import { useEffect, useRef } from "react"
import { VStack, Box, Text } from "@chakra-ui/react"
import { useScenario } from "@/lib/use-scenario"

export default function Blocks() {
  const { currentScenario } = useScenario()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const rawCountries = currentScenario?.countries && currentScenario.countries.length > 0
    ? currentScenario.countries
    : ["Mexico", "myanmar", "saudi arabia", "thailand"]

  const otherCountries = rawCountries.filter((c) => c.toLowerCase() !== 'méxico')
  const displayCountries = ['México', ...otherCountries].slice(0, 4)

  useEffect(() => {
    if (!currentScenario || !overlayRef.current || !videoRef.current) return

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

    const timer = setTimeout(() => {
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none'
      }
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }, 1200)

    return () => {
      clearTimeout(timer)
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

      <VStack p="5vh" minH={"100dvh"} minW={'100dvw'} align={"stretch"} gap={'2vh'} bg="black">
        <Box h='max' flex={1} bg='white' display="flex" alignItems={'center'} justifyContent={'center'}>
          <Text fontSize={"80px"} color={'black'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
            {displayCountries[0] || 'Mexico'}
          </Text>
        </Box>
        <Box h='max' flex={1} border="3px solid" borderColor="white" display="flex" alignItems={'center'} justifyContent={'center'}>
          <Text maxWidth={'50vw'} fontSize={"80px"} color={'white'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
            {displayCountries[1] || ''}
          </Text>
        </Box>
        <Box h='max' flex={1} border="3px solid" borderColor="white" display="flex" alignItems={'center'} justifyContent={'center'}>
          <Text maxWidth={'50vw'} fontSize={"80px"} color={'white'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
            {displayCountries[2] || ''}
          </Text>
        </Box>
        <Box h='max' flex={1} border="3px solid" borderColor="white" display="flex" alignItems={'center'} justifyContent={'center'}>
          <Text maxWidth={'50vw'} fontSize={"80px"} color={'white'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
            {displayCountries[3] || ''}
          </Text>
        </Box>
      </VStack>
    </>
  )
}