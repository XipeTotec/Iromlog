import React, { useState, useEffect } from 'react';

export default function ExerciseDemo({ url, url2, alt }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!url2) return;
    const id = setInterval(() => setFrame(f => 1 - f), 700);
    return () => clearInterval(id);
  }, [url2]);

  return (
    <img
      src={frame === 0 ? url : url2}
      alt={alt}
      className="max-h-52 w-auto object-contain rounded"
    />
  );
}
