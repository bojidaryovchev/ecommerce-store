import { SwiperContainer, SwiperSlide } from "swiper/element";
import { SwiperOptions } from "swiper/types";

type DetailedHTMLProps<T> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "swiper-container": DetailedHTMLProps<SwiperContainer> & SwiperOptions;
      "swiper-slide": DetailedHTMLProps<SwiperSlide>;
    }
  }
}
