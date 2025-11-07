// types/swiper-elements.d.ts

import type { SwiperContainer, SwiperSlide } from "swiper/element";
import type { SwiperOptions } from "swiper/types";

// Extend React's existing JSX definitions instead of overwriting them
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "swiper-container": React.DetailedHTMLProps<React.HTMLAttributes<SwiperContainer>, SwiperContainer> &
        SwiperOptions;

      "swiper-slide": React.DetailedHTMLProps<React.HTMLAttributes<SwiperSlide>, SwiperSlide>;
    }
  }
}
