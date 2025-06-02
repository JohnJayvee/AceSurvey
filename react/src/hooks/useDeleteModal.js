import { useState, useCallback } from 'react';

export function useDeleteModal() {
   const [modalState, setModalState] = useState({
      isOpen: false,
      surveyToDelete: null
   });

   const openModal = useCallback((surveyId) => {
      setModalState({
         isOpen: true,
         surveyToDelete: surveyId
      });
   }, []);

   const closeModal = useCallback(() => {
      setModalState({
         isOpen: false,
         surveyToDelete: null
      });
   }, []);

   return {
      ...modalState,
      openModal,
      closeModal
   };
}
