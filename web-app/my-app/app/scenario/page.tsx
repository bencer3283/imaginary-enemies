'use client'

import { VStack, Text } from "@chakra-ui/react"
import { useScenario } from "@/lib/use-scenario"

export default function Scenario() {
  const { currentScenario } = useScenario()

  const headline = currentScenario?.headline ?? "Una red de insulina falsificada contamina el suministro regional."
  const body = currentScenario?.body ?? "Insulina falsificada, cuyo origen se ha rastreado hasta laboratorios en la frontera con Myanmar, ha entrado en la cadena de suministro regional, y el número de fallecimientos va en aumento. Tailandia atribuye la situación a la laxa supervisión de Myanmar; por su parte, Myanmar niega que los laboratorios se encuentren en su territorio. Arabia Saudita, un importante comprador, ha suspendido todas las importaciones de la región. México, cuya empresa posee la licencia del producto auténtico, controla la única prueba capaz de distinguir entre la insulina legítima y la falsificada, y está racionando su uso."

  return (
    <VStack p="5vh" minH={"100dvh"} minW={'100dvw'} align={"stretch"} gap={'2vh'}>
      <Text fontSize={"64px"} color={'gray.800'} textTransform={'capitalize'} fontFamily='var(--font-jetbrains-mono)' fontWeight={700}>
        {headline}
      </Text>
      <Text fontSize={"38px"} color={'gray.800'} fontFamily='var(--font-jetbrains-mono)' fontWeight={300}>
        {body}
      </Text>
    </VStack>
  )
}