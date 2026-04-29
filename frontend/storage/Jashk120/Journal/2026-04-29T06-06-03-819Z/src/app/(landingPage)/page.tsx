```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';

/**
 * Home is the main landing page component. It displays a welcome message,
 * a carousel of motivational trading messages with autoplay, and a call-to-action
 * button to navigate to the trade journal page.
 *
 * @returns The landing page JSX structure.
 */
export default function Home() {
  const router = useRouter();

  /**
   * Navigates the user to the '/trades' page by replacing the current history entry.
   * This prevents the user from returning to the landing page via the back button.
   *
   * @returns void
   */
  const handleClick = () => {
    router.replace('/trades');
  };

  const messages = [
    {
      title: "Keep a Detailed Forex Journal",
      content: "Document every trade to analyze your strategies and improve performance. Consistency is key!",
    },
    {
      title: "Reflect on Your Trades",
      content: "Write down your emotions and thoughts during trades to understand your decision-making process.",
    },
    {
      title: "Learn from Your Successes and Failures",
      content: "Review your past trades to identify patterns and areas for improvement.",
    },
    {
      title: "Stay Disciplined",
      content: "Maintain discipline in your trading by following a well-documented strategy.",
    },
  ];

  return (
    <>
      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-24 py-12 bg-gray-800 text-white">
        <section className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold">
            Welcome to Your Forex Trading Journal
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg">
            Capture your journey in the Forex market, one trade at a time.
          </p>
        </section>

        {/* Carousel for Motivational Messages */}
        <div className="w-full max-w-lg md:max-w-xl">
          <Carousel
            plugins={[Autoplay({ delay: 3000 })]}
            className="w-full"
          >
            <CarouselContent>
              {messages.map((message, index) => (
                <CarouselItem key={index} className="p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{message.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>{message.content}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Call to Action Button */}
        <section className="mt-8 text-center">
          <Button
            onClick={handleClick} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
              Start Your Journal
          </Button>
        </section>
      </main>
    </>
  );
}
```