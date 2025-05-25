import { Router } from 'express';
import { 
  getTodos, 
  createTodo, 
  deleteTodo, 
  toggleTodo, 
  summarizeTodos 
} from '../controllers/todoController.js';

const router = Router();

// Todo routes
router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .delete(deleteTodo);

router.route('/:id/toggle')
  .patch(toggleTodo);

router.route('/summarize')
  .post(summarizeTodos);

export default router;
