//language=handlebars
export const template = `
import React, {useEffect, useState} from "react";
import type { Response } from "@wundergraph/sdk";
{{#if hasModelImports}}import { {{modelImports}} } from "./models";{{/if}}
{{#if hasHookImports}}import { {{hookImports}} } from "./hooks";{{/if}}
import jsonSchema from "./jsonschema";
import Form from "@rjsf/core";

export interface FormProps<T> {
    onResult?: (result: T) => void;
    liveValidate?: boolean
}

export interface MutationFormProps<T> extends FormProps<T> {
    refetchMountedQueriesOnSuccess?: boolean
}

{{#each mutations}}
export const {{name}}Form: React.FC<MutationFormProps<Response<{{responseType}}>>> = ({onResult,refetchMountedQueriesOnSuccess,liveValidate}) => {
    const [formData,setFormData] = useState<{{inputType}}>();
    const {mutate,response} = useMutation.{{name}}({refetchMountedQueriesOnSuccess});
    useEffect(()=>{
        if (onResult){
            onResult(response);
        }
    },[response]);
    return (
        <div>
            <Form schema={jsonSchema.{{name}}.input}
                  formData={formData}
                  liveValidate={liveValidate}
                  onChange={e => {setFormData(e.formData)}}
                  onSubmit={async (e) => {
                      await mutate({input: e.formData,refetchMountedQueriesOnSuccess});
                      setFormData(undefined);
                  }}/>
        </div>
    )
}
{{/each}}

{{#each queries}}
export const {{name}}Form: React.FC<FormProps<Response<{{responseType}}>>> = ({onResult,liveValidate}) => {
    const [formData,setFormData] = useState<{{inputType}}>();
    const {response,refetch} = useQuery.{{name}}({input: formData});
    useEffect(()=>{
        if (onResult){
            onResult(response);
        }
    },[response]);
    return (
        <div>
            <Form schema={jsonSchema.{{name}}.input}
                  formData={formData}
                  liveValidate={liveValidate}
                  onChange={e => {setFormData(e.formData)}}
                  onSubmit={async (e) => {
                      await refetch({input: formData})
                  }}/>
        </div>
    )
}
{{/each}}

{{#each liveQueries}}
    export const {{name}}LiveForm: React.FC<FormProps<Response<{{responseType}}>>> = ({onResult,liveValidate}) => {
        const [formData,setFormData] = useState<{{inputType}}>();
        const {response} = useLiveQuery.{{name}}({input: formData});
        useEffect(()=>{
            if (onResult){
                onResult(response);
            }
        },[response]);
        return (
            <div>
                <Form schema={jsonSchema.{{name}}.input}
                      formData={formData}
                      liveValidate={liveValidate}
                      onChange={e => {setFormData(e.formData)}}
                      children={<></>}
                      />
            </div>
        )
    }
{{/each}}

{{#each subscriptions}}
    export const {{name}}Form: React.FC<FormProps<Response<{{responseType}}>>> = ({onResult,liveValidate}) => {
        const [formData,setFormData] = useState<{{inputType}}>();
        const {response} = useSubscription.{{name}}({input: formData});
        useEffect(()=>{
            if (onResult){
                onResult(response);
            }
        },[response]);
        return (
            <div>
                <Form schema={jsonSchema.{{name}}.input}
                      formData={formData}
                      liveValidate={liveValidate}
                      onChange={e => {setFormData(e.formData)}}
                      onSubmit={async (e) => {
                          await refetch({input: formData})
                      }}/>
            </div>
        )
    }
{{/each}}
`;
