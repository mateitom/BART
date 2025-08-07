"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Info } from 'lucide-react'

interface BalloonData {
  globo: number
  inflaciones: number
  exploto: boolean
  puntos_ganados: number
  punto_explosion: number
}

type GameState = "instructions" | "practice" | "playing" | "results"

export default function BARTTask() {
  const [gameState, setGameState] = useState<GameState>("instructions")
  const [currentBalloon, setCurrentBalloon] = useState(1)
  const [currentInflations, setCurrentInflations] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [completedBalloons, setCompletedBalloons] = useState(0)
  const [balloonData, setBalloonData] = useState<BalloonData[]>([])
  const [isExploding, setIsExploding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPractice, setIsPractice] = useState(false)

  const inflateBalloon = () => {
    if (isExploding || showSuccess) return

    const newInflations = currentInflations + 1
    const newPoints = currentPoints + 5

    setCurrentInflations(newInflations)
    setCurrentPoints(newPoints)

    // Calcular probabilidad de explosión creciente
    // Fórmula: 1/(128-(i-1)) = 1/(129-i)
    if (!isPractice && newInflations <= 128) {
      const probabilityOfExplosion = 1 / (128 - (newInflations - 1))
      const randomValue = Math.random()

      console.log(
        `Inflación ${newInflations}: Probabilidad = ${(probabilityOfExplosion * 100).toFixed(2)}%, Random = ${randomValue.toFixed(4)}`,
      )

      if (randomValue < probabilityOfExplosion) {
        explodeBalloon(newInflations)
      }
    }
  }

  const explodeBalloon = (inflations: number = currentInflations + 1) => {
    setIsExploding(true)

    // Registrar datos del globo explotado
    if (!isPractice) {
      const balloonInfo: BalloonData = {
        globo: currentBalloon,
        inflaciones: inflations,
        exploto: true,
        puntos_ganados: 0,
        punto_explosion: inflations, // El punto donde explotó
      }
      setBalloonData((prev) => [...prev, balloonInfo])
    }

    setTimeout(() => {
      setIsExploding(false)
      nextBalloon()
    }, 1500)
  }

  const collectPoints = () => {
    if (isExploding || showSuccess) return

    setShowSuccess(true)
    const earnedPoints = currentPoints
    setTotalPoints((prev) => prev + earnedPoints)

    // Registrar datos del globo cobrado
    if (!isPractice) {
      const balloonInfo: BalloonData = {
        globo: currentBalloon,
        inflaciones: currentInflations,
        exploto: false,
        puntos_ganados: earnedPoints,
        punto_explosion: currentInflations, // Punto donde se cobró
      }
      setBalloonData((prev) => [...prev, balloonInfo])
    }

    setTimeout(() => {
      setShowSuccess(false)
      nextBalloon()
    }, 1000)
  }

  const nextBalloon = () => {
    if (isPractice) {
      setIsPractice(false)
      setGameState("playing")
      resetBalloonState()
      return
    }

    if (currentBalloon >= 10) {
      setGameState("results")
      return
    }

    setCurrentBalloon((prev) => prev + 1)
    setCompletedBalloons((prev) => prev + 1)
    resetBalloonState()
  }

  const resetBalloonState = () => {
    setCurrentInflations(0)
    setCurrentPoints(0)
  }

  const startPractice = () => {
    setIsPractice(true)
    setGameState("practice")
    resetBalloonState()
  }

  const startGame = () => {
    setGameState("playing")
    setCurrentBalloon(1)
    setCompletedBalloons(0)
    setTotalPoints(0)
    setBalloonData([])
    resetBalloonState()
  }

  const calculateResults = () => {
    const globos_no_explotados = balloonData.filter((b) => !b.exploto)
    const globos_explotados = balloonData.filter((b) => b.exploto)
    
    // Total de infladas en globos no explotados
    const total_infladas_no_explotados = globos_no_explotados.reduce((sum, b) => sum + b.inflaciones, 0)
    
    // Total de infladas en todos los globos (explotados y no explotados)
    const total_infladas_todos = balloonData.reduce((sum, b) => sum + b.inflaciones, 0)
    
    // Promedio ajustado = total infladas no explotados / total globos no explotados
    const promedio_ajustado = globos_no_explotados.length > 0 
      ? Math.round((total_infladas_no_explotados / globos_no_explotados.length) * 10) / 10
      : 0
    
    // Promedio no ajustado = total infladas todos / total globos
    const promedio_no_ajustado = balloonData.length > 0 
      ? Math.round((total_infladas_todos / balloonData.length) * 10) / 10
      : 0
    
    // Total de globos explotados
    const total_globos_explotados = globos_explotados.length
    
    // Total de infladas en el globo más inflado
    const max_infladas = balloonData.length > 0 
      ? Math.max(...balloonData.map(b => b.inflaciones))
      : 0
    
    // Total de puntos obtenidos
    const total_puntos = totalPoints

    return {
      promedio_ajustado,
      promedio_no_ajustado,
      total_globos_explotados,
      max_infladas,
      total_puntos,
      detalles_por_globo: balloonData,
    }
  }

  const getBalloonSize = () => {
    const baseSize = 80
    const maxSize = 200
    const sizeIncrease = (maxSize - baseSize) * (currentInflations / 50)
    return Math.min(baseSize + sizeIncrease, maxSize)
  }

  const [countdown, setCountdown] = React.useState(30)
  const [baseRedirectUrl] = React.useState("https://encuestas3.unc.edu.ar/index.php?r=survey/index&sid=462821&newtest=Y&lang=es-AR") // CAMBIAR ESTE LINK

  React.useEffect(() => {
    if (gameState !== "results") return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Crear URL con resultados como parámetros
          const results = calculateResults()
          const urlParams = new URLSearchParams()
          
          // Agregar parámetros de resultados a la URL
          urlParams.append('timestamp', new Date().toISOString())
          urlParams.append('promedio_ajustado', results.promedio_ajustado.toString())
          urlParams.append('promedio_no_ajustado', results.promedio_no_ajustado.toString())
          urlParams.append('total_globos_explotados', results.total_globos_explotados.toString())
          urlParams.append('max_infladas', results.max_infladas.toString())
          urlParams.append('total_puntos', results.total_puntos.toString())
          
          // Construir URL final
          const separator = baseRedirectUrl.includes('?') ? '&' : '?'
          const finalUrl = `${baseRedirectUrl}${separator}${urlParams.toString()}`
          
          console.log('Redirigiendo con resultados:', finalUrl)
          window.location.href = finalUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, baseRedirectUrl])

  React.useEffect(() => {
    if (gameState === "results") {
      setCountdown(30)
    }
  }, [gameState])

  const handleReturnToSurvey = () => {
    // Crear URL con resultados como parámetros
    const results = calculateResults()
    const urlParams = new URLSearchParams()
    
    // Agregar parámetros de resultados a la URL
    urlParams.append('timestamp', new Date().toISOString())
    urlParams.append('promedio_ajustado', results.promedio_ajustado.toString())
    urlParams.append('promedio_no_ajustado', results.promedio_no_ajustado.toString())
    urlParams.append('total_globos_explotados', results.total_globos_explotados.toString())
    urlParams.append('max_infladas', results.max_infladas.toString())
    urlParams.append('total_puntos', results.total_puntos.toString())
    
    // Construir URL final
    const separator = baseRedirectUrl.includes('?') ? '&' : '?'
    const finalUrl = `${baseRedirectUrl}${separator}${urlParams.toString()}`
    
    console.log('Redirigiendo con resultados:', finalUrl)
    window.location.href = finalUrl
  }

  if (gameState === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-800">
                Tarea del Globo Analógico de Riesgo (BART)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  <Info className="inline w-5 h-5 mr-2" />
                  Instrucciones
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Verás una serie de 10 globos, uno a la vez</li>
                  <li>
                    • Cada vez que inflés un globo, ganarás <strong>5 puntos</strong>
                  </li>
                  <li>• Puedes inflar el globo tantas veces como quieras</li>
                  <li>• En cualquier momento puedes hacer clic en "Cobrar puntos" para guardar tus ganancias</li>
                  <li>
                    • <strong>¡CUIDADO!</strong> Si el globo explota, perderás todos los puntos de ese globo
                  </li>
                  <li>• Cada globo tiene un punto de explosión diferente y desconocido</li>
                  <li>• Tu objetivo es ganar la mayor cantidad de puntos posible</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* <Button onClick={startPractice} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Play className="w-4 h-4" />
                  Globo de Práctica
                </Button> */}
                <Button onClick={startGame} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Comenzar Juego
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === "results") {
    const results = calculateResults()

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-800">¡Juego Completado!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-800">{results.total_puntos} puntos</div>
                  <div className="text-sm text-green-600">Total Ganado</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-800">{results.total_globos_explotados}</div>
                  <div className="text-sm text-blue-600">Globos Explotados</div>
                </div>
              </div>

             {/*  <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Resumen de Resultados:</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    • Promedio ajustado de infladas: <strong>{results.promedio_ajustado}</strong>
                  </li>
                  <li>
                    • Promedio no ajustado de infladas: <strong>{results.promedio_no_ajustado}</strong>
                  </li>
                  <li>
                    • Globos explotados: <strong>{results.total_globos_explotados}</strong>
                  </li>
                  <li>
                    • Máximo de infladas en un globo: <strong>{results.max_infladas}</strong>
                  </li>
                  <li>
                    • Total de puntos: <strong>{results.total_puntos}</strong>
                  </li>
                </ul>
              </div> */}

              {/* Countdown y botón de redirección */}
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-blue-600 mb-2">
                  Serás redirigido automáticamente en {countdown} segundos
                </div>
                <div className="text-xs text-blue-500 mb-2">
                  Los resultados se enviarán automáticamente con la redirección
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleReturnToSurvey} className="flex items-center gap-2 w-full">
                  <span></span>
                  Continuar la encuesta
                </Button>
              </div>

              {/* Información de debug (solo visible en desarrollo) */}
              {/* {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded-lg text-xs">
                  <strong>Debug Info:</strong>
                  <br />
                  Promedio ajustado: {results.promedio_ajustado}
                  <br />
                  Promedio no ajustado: {results.promedio_no_ajustado}
                  <br />
                  Globos explotados: {results.total_globos_explotados}
                  <br />
                  Máx infladas: {results.max_infladas}
                  <br />
                  Total puntos: {results.total_puntos}
                </div>
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header con información del juego */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="secondary">{isPractice ? "Práctica" : `Globo ${currentBalloon} de 10`}</Badge>
              <Badge variant="outline">Completados: {completedBalloons}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Globo actual:</span>
                <div className="font-semibold">{currentPoints} puntos</div>
              </div>
              <div>
                <span className="text-gray-600">Total acumulado:</span>
                <div className="font-semibold text-green-600">{totalPoints} puntos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área del globo */}
        <Card className="mb-4">
          <CardContent className="p-8 text-center">
            <div className="relative flex justify-center items-center h-64">
              {isExploding ? (
                <div className="text-6xl animate-pulse">💥</div>
              ) : showSuccess ? (
                <div className="text-4xl animate-bounce">✅</div>
              ) : (
                <div
                  className={`balloon transition-all duration-300 ${currentInflations > 0 ? "animate-pulse" : ""}`}
                  style={{
                    width: `${getBalloonSize()}px`,
                    height: `${getBalloonSize() * 1.2}px`, // Más alto que ancho
                    backgroundColor: `hsl(${Math.min(currentInflations * 3, 60)}, 70%, 60%)`,
                    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", // Forma de globo
                    border: "3px solid rgba(0,0,0,0.1)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    position: "relative",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"
                    style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                  ></div>

                  {/* Nudo del globo */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                    style={{
                      width: `${getBalloonSize() * 0.15}px`,
                      height: `${getBalloonSize() * 0.1}px`,
                      backgroundColor: `hsl(${Math.min(currentInflations * 3, 60)}, 70%, 50%)`,
                      borderRadius: "0 0 50% 50%",
                      border: "2px solid rgba(0,0,0,0.1)",
                    }}
                  ></div>

                  {/* Hilo del globo */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                    style={{
                      width: "2px",
                      height: `${getBalloonSize() * 0.3}px`,
                      backgroundColor: "rgba(0,0,0,0.3)",
                      transform: "translateX(-50%) translateY(100%)",
                    }}
                  ></div>
                </div>
              )}
            </div>

            <div className="mt-4 text-lg font-semibold">Inflaciones: {currentInflations}</div>
          </CardContent>
        </Card>

        {/* Botones de control */}
        <div className="space-y-3">
          <Button
            onClick={inflateBalloon}
            disabled={isExploding || showSuccess}
            className="w-full h-12 text-lg"
            size="lg"
          >
            🎈 Inflar Globo (+5 puntos)
          </Button>

          <Button
            onClick={collectPoints}
            disabled={currentPoints === 0 || isExploding || showSuccess}
            variant="outline"
            className="w-full h-12 text-lg bg-transparent"
            size="lg"
          >
            💰 Cobrar Puntos ({currentPoints} puntos)
          </Button>
        </div>

        {/* Mensajes de estado */}
        {isExploding && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center">
            <div className="text-red-800 font-semibold">¡El globo explotó!</div>
            <div className="text-red-600 text-sm">Perdiste {currentPoints} puntos</div>
          </div>
        )}

        {showSuccess && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
            <div className="text-green-800 font-semibold">¡Puntos cobrados!</div>
            <div className="text-green-600 text-sm">Ganaste {currentPoints} puntos</div>
          </div>
        )}
      </div>
    </div>
  )
}
