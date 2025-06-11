import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';

export const statusColors = {
  [StatusEnum.NOT_STARTED]: 'bg-gray-500 text-white',
  [StatusEnum.WORKING_ON_IT]: 'bg-yellow-500 text-white',
  [StatusEnum.STUCK]: 'bg-red-500 text-white',
  [StatusEnum.DONE]: 'bg-green-500 text-white'
};

export const priorityColors = {
  [PriorityEnum.LOW]: 'bg-blue-200 text-blue-800',
  [PriorityEnum.MEDIUM]: 'bg-yellow-200 text-yellow-800',
  [PriorityEnum.HIGH]: 'bg-red-200 text-red-800',
  [PriorityEnum.CRITICAL]: 'bg-purple-200 text-purple-800'
};
