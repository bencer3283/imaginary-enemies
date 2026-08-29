'use client'

import { VStack, Box, Text } from "@chakra-ui/react"
import { useScenario } from "@/lib/use-scenario"

export default function Blocks() {
  const { currentScenario } = useScenario()

  const rawCountries = currentScenario?.countries && currentScenario.countries.length > 0
    ? currentScenario.countries
    : ["Mexico", "myanmar", "saudi arabia", "thailand"]

  const otherCountries = rawCountries.filter((c) => c.toLowerCase() !== 'mexico')
  const displayCountries = ['Mexico', ...otherCountries].slice(0, 4)

  return (
    <VStack p="5vh" minH={"100dvh"} minW={'100dvw'} align={"stretch"} gap={'2vh'}>
      <Box h='max' flex={1} bg='gray.800' display="flex" alignItems={'center'} justifyContent={'center'}>
        <Text fontSize={"80px"} color={'white'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
          {displayCountries[0] || 'Mexico'}
        </Text>
      </Box>
      <Box h='max' flex={1} bg='gray.200' display="flex" alignItems={'center'} justifyContent={'center'}>
        <Text fontSize={"80px"} color={'gray.800'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
          {displayCountries[1] || ''}
        </Text>
      </Box>
      <Box h='max' flex={1} bg='gray.200' display="flex" alignItems={'center'} justifyContent={'center'}>
        <Text fontSize={"80px"} color={'gray.800'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
          {displayCountries[2] || ''}
        </Text>
      </Box>
      <Box h='max' flex={1} bg='gray.200' display="flex" alignItems={'center'} justifyContent={'center'}>
        <Text fontSize={"80px"} color={'gray.800'} textTransform={'uppercase'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
          {displayCountries[3] || ''}
        </Text>
      </Box>
    </VStack>
  )
}