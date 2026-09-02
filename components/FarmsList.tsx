import React from 'react';
import FarmCard from '@/components/FarmCard';

const sampleFarms = [
  {
    name: 'Green Valley Farm',
    location: 'Bamenda',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=60',
    bio: 'Organic vegetables and fruits.',
  },
  {
    name: 'Sunrise Plantation',
    location: 'Douala',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=500&q=60',
    bio: 'Fresh cocoa and coffee beans.',
  },
];

export default function FarmsList() {
  return (
    <>
      {sampleFarms.map((farm, idx) => (
        <FarmCard key={idx} {...farm} />
      ))}
    </>
  );
}
