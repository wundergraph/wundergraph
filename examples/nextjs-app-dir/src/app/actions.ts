'use server';

import { client } from '@/lib/wundergraph';
import { data } from 'autoprefixer';
import { revalidatePath } from 'next/cache';
import { AllTodosResponseData } from '../../.wundergraph/generated/models';

export const toggleTodo = async (data: NonNullable<AllTodosResponseData['todos_todos']>[0]) => {
	await client.mutate({
		operationName: 'updateTodo',
		input: {
			...data,
			isCompleted: !data.isCompleted,
		},
	});

	revalidatePath('/');
};
