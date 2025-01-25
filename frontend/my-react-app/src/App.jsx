import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Flex, Text, Button } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css"
import './App.css'

function App() {

  return (
    <>
      <Flex direction="column" gap="2">
         <Text>Hello from Radix Themes :)</Text>
         <Button>Let's go</Button>
      </Flex>
    </>
  )
}

export default App
