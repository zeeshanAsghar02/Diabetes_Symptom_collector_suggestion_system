import React from 'react';
import { Box, Typography } from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FavoriteIcon from '@mui/icons-material/Favorite';

const items = [
  {
    quote: "Diabetes is a journey, not a destination.",
    icon: <FormatQuoteIcon sx={{ fontSize: 100, color: 'text.secondary' }} />,
  },
  {
    quote: "Awareness is the first step toward cure.",
    icon: <LightbulbIcon sx={{ fontSize: 100, color: 'text.secondary' }} />,
  },
  {
    quote: "Your health is an investment, not an expense.",
    icon: <FavoriteIcon sx={{ fontSize: 100, color: 'text.secondary' }} />,
  },
];

const sliderSettings = {
  dots: true,
  infinite: true,
  autoplay: true,
  speed: 500,
  slidesToShow: 1,
  arrows: false,
  slidesToScroll: 1,
};

export default function DiabetesQuotes() {
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 500 },
        maxWidth: '100%',
        '& .slick-dots li button:before': {
          color: 'text.secondary', // inactive dot color
        },
        '& .slick-dots li.slick-active button:before': {
          color: 'text.primary', // active dot color
        },
      }}
    >
      <Slider {...sliderSettings}>
        {items.map((item, index) => (
          <Box key={index} sx={{ textAlign: 'center', px: 2 }}>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
              {item.icon}
            </Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary" fontSize="22px">
              {item.quote}
            </Typography>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}
