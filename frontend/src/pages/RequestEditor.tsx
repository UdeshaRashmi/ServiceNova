import { useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { requestApi, errorMessage, type RequestInput } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, Loading, PageHeading } from '../components/ui';
import { RequestForm } from '../components/RequestForm';

export function CreateRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/requests" replace />;
  async function submit(values: RequestInput) {
    try {
      const request = await requestApi.create(values);
      toast.success('Your request has been submitted.');
      navigate(`/requests/${request.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="LET’S GET IT SORTED"
        title="Create a request"
        description="Tell us what you need. We’ll take it from here."
      />
      <RequestForm onSubmit={submit} />
    </>
  );
}
export function EditRequest() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const loader = useCallback(() => requestApi.get(id), [id]);
  const { data, loading, error, reload } = useResource(loader);
  async function submit(values: RequestInput) {
    try {
      await requestApi.update(id, values);
      toast.success('Request updated.');
      navigate(`/requests/${id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        title="Edit request"
        description="Keep your request clear and up to date."
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        data &&
        (data.status === 'PENDING' &&
        data.userId === user?.id &&
        user?.role === 'USER' ? (
          <RequestForm key={data.id} initial={data} onSubmit={submit} />
        ) : (
          <ErrorState message="Only your own pending requests can be edited." />
        ))
      )}
    </>
  );
}
