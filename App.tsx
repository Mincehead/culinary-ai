import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { RecipeList } from './pages/RecipeList';
import { RecipeDetail } from './pages/RecipeDetail';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/Privacy';
import { TermsOfService } from './pages/Terms';
import { ChefAI } from './pages/ChefAI';

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chef-ai" element={<ChefAI />} />
          {/* Legacy route alias */}
          <Route path="/smart-camera" element={<ChefAI />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipe/preview" element={<RecipeDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Route>
      </Routes>
    </HelmetProvider>
  );
};

export default App;
