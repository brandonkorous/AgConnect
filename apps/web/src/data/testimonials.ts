export type Testimonial = {
  id: '1' | '2' | '3';
  role: 'worker' | 'employer' | 'training';
  isPlaceholder: true;
};

export const testimonials: Testimonial[] = [
  { id: '1', role: 'worker', isPlaceholder: true },
  { id: '2', role: 'employer', isPlaceholder: true },
  { id: '3', role: 'training', isPlaceholder: true },
];
