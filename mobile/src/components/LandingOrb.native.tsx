import React from 'react'
import LottieView from 'lottie-react-native'

export function LandingOrb() {
  return (
    <LottieView
      source={require('../../assets/lottie/orb.json')}
      autoPlay
      loop
      style={{ width: 120, height: 120, alignSelf: 'center', marginBottom: 8 }}
    />
  )
}
